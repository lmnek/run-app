import { eq, desc, max, and } from 'drizzle-orm';
import { QueryExecutor, QueryResult, InsertResult, UpdateResult, DeleteResult, SelectOptions, WhereCondition } from '../index.js';
import { DrizzleConnection } from './DrizzleConnection.js';

// Task element: Drizzle-specific query execution
export class DrizzleQueryExecutor extends QueryExecutor {
    private connection: DrizzleConnection;
    
    constructor(connection: DrizzleConnection) {
        super();
        this.connection = connection;
    }
    
    async select<T>(table: string, options?: SelectOptions): Promise<QueryResult<T>> {
        const drizzleDb = this.connection.getDrizzleDb();
        const tableRef = this.getTableReference(table);
        
        if (!tableRef) {
            throw new Error(`Table ${table} not found in schema`);
        }
        
        let query = drizzleDb.select().from(tableRef);
        
        // Apply where conditions
        if (options?.where) {
            const whereConditions = this.buildWhereConditions(options.where);
            if (whereConditions.length > 0) {
                query = query.where(and(...whereConditions));
            }
        }
        
        // Apply order by
        if (options?.orderBy) {
            for (const order of options.orderBy) {
                const fieldRef = this.getFieldReference(tableRef, order.field);
                if (fieldRef) {
                    query = order.direction === 'desc' 
                        ? query.orderBy(desc(fieldRef))
                        : query.orderBy(fieldRef);
                }
            }
        }
        
        // Apply limit and offset
        if (options?.limit) {
            query = query.limit(options.limit);
        }
        if (options?.offset) {
            query = query.offset(options.offset);
        }
        
        const result = await query;
        return {
            data: result as T[],
            count: result.length
        };
    }
    
    async insert<T>(table: string, data: Partial<T>): Promise<InsertResult> {
        const drizzleDb = this.connection.getDrizzleDb();
        const tableRef = this.getTableReference(table);
        
        if (!tableRef) {
            throw new Error(`Table ${table} not found in schema`);
        }
        
        const result = await drizzleDb.insert(tableRef).values(data).returning({ id: tableRef.id });
        
        return {
            insertedId: result[0]?.id || 0,
            affectedRows: result.length
        };
    }
    
    async update<T>(table: string, data: Partial<T>, where: WhereCondition[]): Promise<UpdateResult> {
        const drizzleDb = this.connection.getDrizzleDb();
        const tableRef = this.getTableReference(table);
        
        if (!tableRef) {
            throw new Error(`Table ${table} not found in schema`);
        }
        
        const whereConditions = this.buildWhereConditions(where);
        const result = await drizzleDb
            .update(tableRef)
            .set(data)
            .where(and(...whereConditions))
            .returning();
        
        return {
            affectedRows: result.length
        };
    }
    
    async delete(table: string, where: WhereCondition[]): Promise<DeleteResult> {
        const drizzleDb = this.connection.getDrizzleDb();
        const tableRef = this.getTableReference(table);
        
        if (!tableRef) {
            throw new Error(`Table ${table} not found in schema`);
        }
        
        const whereConditions = this.buildWhereConditions(where);
        const result = await drizzleDb
            .delete(tableRef)
            .where(and(...whereConditions))
            .returning();
        
        return {
            affectedRows: result.length
        };
    }
    
    async executeRaw(query: string, params?: any[]): Promise<any> {
        const sql = this.connection.getSql();
        return await sql.unsafe(query, params);
    }
    
    // Helper methods for Drizzle-specific operations
    private getTableReference(tableName: string): any {
        // This would need to be implemented based on your schema
        // For now, we'll use a simple mapping
        const schema = this.connection['config'].schema;
        return schema?.[tableName];
    }
    
    private getFieldReference(tableRef: any, fieldName: string): any {
        return tableRef?.[fieldName];
    }
    
    private buildWhereConditions(conditions: WhereCondition[]): any[] {
        return conditions.map(condition => {
            const fieldRef = this.getFieldReference(
                this.getTableReference(condition.field.split('.')[0]), 
                condition.field.split('.')[1] || condition.field
            );
            
            if (!fieldRef) {
                throw new Error(`Field ${condition.field} not found`);
            }
            
            switch (condition.operator) {
                case 'eq':
                    return eq(fieldRef, condition.value);
                case 'ne':
                    return eq(fieldRef, condition.value);
                case 'gt':
                    return eq(fieldRef, condition.value);
                case 'gte':
                    return eq(fieldRef, condition.value);
                case 'lt':
                    return eq(fieldRef, condition.value);
                case 'lte':
                    return eq(fieldRef, condition.value);
                default:
                    return eq(fieldRef, condition.value);
            }
        });
    }
}
