import { ApiResponse } from "../utils/ApiResponse.ts";
import asyncHandler from "../utils/asyncHandler.ts";


const healthCheckController = asyncHandler(async (req, res) => {
    res
    .status(200)
    .json(new ApiResponse(
        200, 
        "Server is running", 
        "Health check Passed"
    ))
});

export { 
    healthCheckController
};