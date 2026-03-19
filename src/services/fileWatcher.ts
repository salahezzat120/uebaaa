// File watcher service to detect CSV file updates
// Uses polling since browsers don't support FileSystemWatcher

export interface FileWatchOptions {
  pollingInterval?: number; // milliseconds between checks
  onFileChanged?: (file: File) => void;
  onFileRemoved?: () => void;
}

export class FileWatcher {
  private file: File | null = null;
  private intervalId: NodeJS.Timeout | null = null;
  private options: FileWatchOptions;
  private lastSize = 0;
  private lastModified = 0;

  constructor(options: FileWatchOptions = {}) {
    this.options = {
      pollingInterval: 2000, // Check every 2 seconds
      ...options,
    };
  }

  watch(file: File): void {
    this.file = file;
    this.lastSize = file.size;
    this.lastModified = file.lastModified;

    // Start polling if not already running
    if (!this.intervalId) {
      this.startPolling();
    }
  }

  private startPolling(): void {
    this.intervalId = setInterval(() => {
      if (this.file) {
        this.checkFile();
      }
    }, this.options.pollingInterval);
  }

  private async checkFile(): Promise<void> {
    if (!this.file) return;

    try {
      // For File objects in browser, we can't actually watch file system changes
      // Instead, we rely on the file input change event
      // This service is mainly for tracking and can be extended for server-side files
      
      // If file was removed
      if (!this.file) {
        this.stop();
        if (this.options.onFileRemoved) {
          this.options.onFileRemoved();
        }
        return;
      }

      // Check if file metadata changed
      const sizeChanged = this.file.size !== this.lastSize;
      const modifiedChanged = this.file.lastModified !== this.lastModified;

      if (sizeChanged || modifiedChanged) {
        this.lastSize = this.file.size;
        this.lastModified = this.file.lastModified;

        if (this.options.onFileChanged) {
          this.options.onFileChanged(this.file);
        }
      }
    } catch (error) {
      console.error('File watch error:', error);
    }
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.file = null;
  }

  getCurrentFile(): File | null {
    return this.file;
  }

  isWatching(): boolean {
    return this.intervalId !== null;
  }
}





