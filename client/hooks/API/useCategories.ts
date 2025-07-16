import useSWR from "swr";
import { fetcher } from "@/utils/fetcher";
import { ICategory } from "@/types/category.type";

export const useCategories = () => {
  const { data, error, isLoading: categoriesIsLoading, mutate: categoriesMutate } = useSWR<ICategory[]>(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/categories`,
    fetcher
  );

  return {
    categories: data || [],
    categoriesIsLoading,
    categoriesIsError: !!error,
    categoriesMutate,
  };
};

