/**
 * AI Categorization Queue
 *
 * Manages batch AI categorization requests with rate limiting.
 * Ensures we stay under API limits by queuing requests.
 */

interface AICategorizationResult {
  success: boolean;
  merchantInfo?: {
    name: string;
    businessType: string;
    description: string;
    suggestedCategory: string;
  };
  source?: string;
  error?: string;
}

interface QueueItem {
  merchantName: string;
  resolve: (result: AICategorizationResult) => void;
  reject: (error: Error) => void;
}

class AICategorizationQueue {
  private queue: QueueItem[] = [];
  private processing = false;
  private requestsPerMinute = 10; // gemini-2.5-flash-lite limit
  private intervalMs = 60000 / this.requestsPerMinute; // ~6 seconds between requests

  /**
   * Add a categorization request to the queue
   */
  async categorize(merchantName: string): Promise<AICategorizationResult> {
    return new Promise((resolve, reject) => {
      this.queue.push({ merchantName, resolve, reject });

      // Start processing if not already running
      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  /**
   * Process queued requests with rate limiting
   */
  private async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const item = this.queue.shift();
      if (!item) break;

      try {
        const response = await fetch('/api/search-merchant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ merchantName: item.merchantName }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        item.resolve(data);

        // Wait before processing next request to respect rate limits
        if (this.queue.length > 0) {
          await new Promise(resolve => setTimeout(resolve, this.intervalMs));
        }
      } catch (error) {
        item.reject(error instanceof Error ? error : new Error(String(error)));
      }
    }

    this.processing = false;
  }

  /**
   * Get current queue length
   */
  getQueueLength(): number {
    return this.queue.length;
  }

  /**
   * Check if queue is processing
   */
  isProcessing(): boolean {
    return this.processing;
  }
}

// Export singleton instance
export const aiQueue = new AICategorizationQueue();
