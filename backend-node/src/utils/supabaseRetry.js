/**
 * Retry utility for Supabase queries with exponential backoff
 * Helps handle transient connection timeout errors
 */

export async function retrySupabaseQuery(queryFn, maxRetries = 3, initialDelay = 1000) {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await queryFn();
      // If query succeeded but has error, only retry on connection/timeout errors
      if (result.error) {
        const errorMessage = result.error.message || '';
        const isTimeoutError = errorMessage.includes('timeout') || 
                              errorMessage.includes('ConnectTimeoutError') ||
                              errorMessage.includes('ECONNRESET') ||
                              errorMessage.includes('ETIMEDOUT');
        
        if (isTimeoutError && attempt < maxRetries - 1) {
          // Calculate exponential backoff delay
          const delay = initialDelay * Math.pow(2, attempt);
          console.warn(`[Supabase Retry] Attempt ${attempt + 1} failed with timeout error. Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          lastError = result.error;
          continue;
        }
      }
      
      // Query succeeded or non-retryable error
      return result;
    } catch (error) {
      const errorMessage = error.message || '';
      const isTimeoutError = errorMessage.includes('timeout') || 
                            errorMessage.includes('ConnectTimeoutError') ||
                            errorMessage.includes('ECONNRESET') ||
                            errorMessage.includes('ETIMEDOUT') ||
                            errorMessage.includes('fetch failed');
      
      if (isTimeoutError && attempt < maxRetries - 1) {
        // Calculate exponential backoff delay
        const delay = initialDelay * Math.pow(2, attempt);
        console.warn(`[Supabase Retry] Attempt ${attempt + 1} failed with timeout error: ${errorMessage}. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        lastError = error;
        continue;
      }
      
      // Non-retryable error or max retries reached
      throw error;
    }
  }
  
  // All retries exhausted
  if (lastError) {
    throw lastError;
  }
  
  throw new Error('Query failed after all retries');
}





