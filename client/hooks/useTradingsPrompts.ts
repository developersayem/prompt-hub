import useSWR from "swr";
import { fetcher } from "@/utils/fetcher";

export function useTradingsPrompts() {
  const key = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/prompts/trending`;

  const { data, error, isLoading, mutate } = useSWR(key, fetcher);

  return {
    prompts: Array.isArray(data) ? data : [],
    error,
    isLoading,
    mutate,
    key,
  };
}
