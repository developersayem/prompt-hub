import useSWR from "swr";
import { fetcher } from "@/utils/fetcher";
import { IAiModel } from "@/types/ai-model.types";

export const useAiModels = () => {
  const { data, error, isLoading: aiModelsIsLoading, mutate: aiModelsMutate } = useSWR<IAiModel[]>(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/ai-models`,
    fetcher
  );

  return {
    aiModels: data || [],
    aiModelsIsLoading,
    aiModelsIsError: !!error,
    aiModelsMutate,
  };
};
