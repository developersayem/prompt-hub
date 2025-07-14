import { fetcher } from "@/utils/fetcher";
import useSWR from "swr";


export function usePromptsBySlug(slug: string) {
  
  const key = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/prompts/slug/${slug}`;

 const { data, error, isLoading, mutate } = useSWR(key, fetcher);

  
// Export the key for use in mutation
return {
  prompts: Array.isArray(data) ? data : [],
  error,
  isLoading,
  mutate,
  key,
};
}
