const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
      Promise.resolve(requestHandler(req, res, next))
      .catch((err) => {
        console.error("Error in promise:", err);
        next(err); // Pass the error to Express error-handling middleware
      });
    };
  };
  
  export default asyncHandler;
  