import { useAuth } from "@clerk/clerk-expo"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { httpLink } from "@trpc/client"
import { useState } from "react"
import { ENV } from "~/utils/constants"
import { trpc } from "~/utils/trpc"

export default function TrpcProvider({ children }: { children: JSX.Element | JSX.Element[] }) {
    const { getToken } = useAuth()

    const [queryClient] = useState(new QueryClient())
    const [trpcClient] = useState(trpc.createClient({
        links: [
            httpLink({
                url: "https://" + ENV.EXPO_PUBLIC_TRPC_URL,
                headers: async () => {
                    let token = await getToken()
                    if (!token) {
                        return {}
                    }
                    return { authorization: "Bearer " + token }
                }
            }),
        ]
    }))

    return (
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </trpc.Provider>
    )
}

