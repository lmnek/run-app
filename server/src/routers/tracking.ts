import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc.js";
import { UserStore } from "../cache/index.js";

// ============================================================================
// CONSTANTS - Configuration values
// ============================================================================

const SEGMENT_DISTANCE_THRESHOLD = 200; // metres
const DEFAULT_SEGMENT_START = 0;
const DEFAULT_SEGMENT_DISTANCE = 0;

// ============================================================================
// DATA ELEMENTS - Encapsulated data structures with version transparency
// ============================================================================

// Data element: GPS position data
export interface Position {
    lat: number;
    long: number;
    alt: number;
    timestamp: number;
    instantSpeed: number;
    distInc: number;
    accuracy: number | null;
}

// Data element: Segment data
export interface Segment {
    fromMetres: number;
    toMetres: number;
    startTime: number;
    endTime: number;
    duration: number;
    speed: number;
}

// Data element: Segment calculation parameters
export interface SegmentCalculationParams {
    fromMetres: number;
    startTime: number;
    curSegDist: number;
    endTime: number;
}

// Data element: Segment creation result
export interface SegmentCreationResult {
    toMetres: number;
    duration: number;
    speed: number;
}

// ============================================================================
// TASK ELEMENTS - Single functional tasks with encapsulated arguments
// ============================================================================

// Task element: Position addition to store
export class PositionAdder {
    static async add(position: Position, store: UserStore): Promise<void> {
        const posLen = await store.positions.length();
        if (posLen === 0) {
            await store.setValue('lastSegEndTime', position.timestamp);
        }
        await store.positions.add(position);
    }
}

// Task element: Distance calculation
export class DistanceCalculator {
    static async calculateNewDistance(store: UserStore, position: Position): Promise<number> {
        const prevDist = await store.getValue('curSegmentDistance');
        const newDist = prevDist
            ? parseInt(prevDist) + position.distInc
            : position.distInc;
        
        await store.setValue('curSegmentDistance', newDist);
        return newDist;
    }
}

// Task element: Segment threshold checker
export class SegmentThresholdChecker {
    static shouldCloseSegment(distance: number): boolean {
        return distance >= SEGMENT_DISTANCE_THRESHOLD;
    }
}

// Task element: Segment data retrieval
export class SegmentDataRetriever {
    static async getSegmentData(store: UserStore): Promise<SegmentCalculationParams> {
        const fromMetresStr = await store.getValue('lastSegToMetres');
        const startTimeStr = await store.getValue('lastSegEndTime');
        const curSegDistStr = await store.getValue('curSegmentDistance');
        
        const fromMetres = parseInt(fromMetresStr!) || DEFAULT_SEGMENT_START;
        const startTime = parseInt(startTimeStr!) || Date.now();
        const curSegDist = curSegDistStr ? parseInt(curSegDistStr) : DEFAULT_SEGMENT_DISTANCE;
        
        return { fromMetres, startTime, curSegDist, endTime: 0 };
    }
}

// Task element: Segment calculation
export class SegmentCalculator {
    static calculateSegment(params: SegmentCalculationParams, newPosition?: Position): SegmentCreationResult | null {
        const { fromMetres, startTime, curSegDist } = params;
        const endTime = newPosition ? newPosition.timestamp : Date.now();
        const duration = (endTime - startTime) / 1000;
        const toMetres = fromMetres + curSegDist;
        
        if (fromMetres === toMetres) {
            return null; // Did not do anything from the previous segment to now
        }
        
        return {
            toMetres,
            duration,
            speed: curSegDist / duration
        };
    }
}

// Task element: Segment persistence
export class SegmentPersister {
    static async saveSegment(
        segment: Segment,
        store: UserStore,
        endTime: number,
        toMetres: number
    ): Promise<void> {
        await Promise.all([
            store.segments.add(segment),
            store.setValue('curSegmentDistance', DEFAULT_SEGMENT_DISTANCE),
            store.setValue('lastSegToMetres', toMetres),
            store.setValue('lastSegEndTime', endTime)
        ]);
    }
}

// Task element: Segment cleanup
export class SegmentCleaner {
    static async clearSegments(store: UserStore): Promise<void> {
        const lastSegment = await store.segments.getOnIdx<Segment>(-1);
        if (lastSegment) {
            await store.setValue('lastSegEndTime', lastSegment.endTime);
            await store.setValue('lastSegToMetres', lastSegment.toMetres);
        } else {
            const lastPos = await store.positions.getOnIdx<Position>(-1);
            await store.setValue('lastSegEndTime', lastPos?.timestamp);
            const curSegDistance = await store.getValue('curSegmentDistance');
            const lastSegToMetres = await store.getValue('lastSegToMetres');
            await store.setValue('lastSegToMetres', parseInt(lastSegToMetres!) + parseInt(curSegDistance!));
        }
        await store.segments.clear();
    }
}

// ============================================================================
// WORKFLOW ELEMENTS - Orchestrating sequences of actions
// ============================================================================

// Workflow element: Position processing workflow
export class PositionProcessingWorkflow {
    static async execute(position: Position, store: UserStore): Promise<void> {
        // Add position to store
        await PositionAdder.add(position, store);
        
        // Calculate new distance
        const newDist = await DistanceCalculator.calculateNewDistance(store, position);
        
        // Check if segment should be closed
        if (SegmentThresholdChecker.shouldCloseSegment(newDist)) {
            await SegmentWorkflow.closeSegment(store, position);
        }
    }
}

// Workflow element: Segment closing workflow
export class SegmentWorkflow {
    static async closeSegment(store: UserStore, newPosition?: Position): Promise<void> {
        // Get segment data
        const segmentParams = await SegmentDataRetriever.getSegmentData(store);
        segmentParams.endTime = newPosition ? newPosition.timestamp : Date.now();
        
        // Calculate segment
        const segmentResult = SegmentCalculator.calculateSegment(segmentParams, newPosition);
        if (!segmentResult) {
            return; // No movement, don't create segment
        }
        
        // Create segment object
        const newSegment: Segment = {
            fromMetres: segmentParams.fromMetres,
            toMetres: segmentResult.toMetres,
            duration: segmentResult.duration,
            speed: segmentResult.speed,
            startTime: segmentParams.startTime,
            endTime: segmentParams.endTime
        };
        
        // Save segment
        await SegmentPersister.saveSegment(
            newSegment,
            store,
            segmentParams.endTime,
            segmentResult.toMetres
        );
    }
}

// ============================================================================
// CONNECTOR ELEMENTS - External system interactions
// ============================================================================

// Connector element: Tracking operations coordinator
export class TrackingConnector {
    static async sendPosition(position: Position, store: UserStore): Promise<void> {
        await PositionProcessingWorkflow.execute(position, store);
    }
    
    static async closeSegment(store: UserStore, newPosition?: Position): Promise<void> {
        await SegmentWorkflow.closeSegment(store, newPosition);
    }
    
    static async clearSegments(store: UserStore): Promise<void> {
        await SegmentCleaner.clearSegments(store);
    }
}

// ============================================================================
// TRIGGER ELEMENTS - Control when actions are triggered
// ============================================================================

// Trigger element: tRPC procedure handlers
export const trackingRouter = createTRPCRouter({
    sendPosition: protectedProcedure
        .input(z.object({
            lat: z.number(),
            long: z.number(),
            alt: z.number(),
            timestamp: z.number(),
            instantSpeed: z.number(),
            distInc: z.number(),
            accuracy: z.number().nullable()
        }))
        .mutation(async ({ input, ctx }: { input: Position, ctx: { store: UserStore } }) => {
            await TrackingConnector.sendPosition(input, ctx.store);
        })
});

// ============================================================================
// LEGACY EXPORTS - Maintain backward compatibility
// ============================================================================

// Legacy function exports for backward compatibility
export const addPosition = TrackingConnector.sendPosition;
export const closeSegment = TrackingConnector.closeSegment;
export const clearSegments = TrackingConnector.clearSegments;
