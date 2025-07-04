import { fetcher } from "@/utils/fetcher";
import useSWR from "swr";

// Define FiltersType or import it from the correct location
type FiltersType = {
  resultType: string;
  // Add other filter fields as needed, e.g. priceRange, tags, aiModels, etc.
};


export function usePrompts(filters: FiltersType, selectedCategory: string) {
  // Build query string from filters & category
  const queryParams = new URLSearchParams();

  if (selectedCategory !== "all") queryParams.append("category", selectedCategory);

  if (filters.resultType !== "all") queryParams.append("searchString", filters.resultType);

  // Add more filters if needed, e.g. priceRange, tags, aiModels etc

  const key = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/prompt?${queryParams.toString()}`;

 const { data, error, isLoading, mutate } = useSWR(key, fetcher);

  
// Export the key for use in mutation
return { prompts: data || [], error, isLoading, mutate, key };
}
