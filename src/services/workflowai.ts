interface WorkflowAIRequest {
  task_input: {
    prompt: string;
  };
  version: "dev" | "prod";
  use_cache: "auto" | "always" | "never";
}

interface WorkflowAIResponse {
  task_output: {
    name: string;
    essay: string;
    songs: Array<{
      title: string;
      artist: string;
    }>;
  };
}

interface PlaylistGenerationResult {
  name: string;
  description: string;
  tracks: Array<{
    title: string;
    artist: string;
  }>;
}

class WorkflowAIService {
  private readonly baseUrl = "https://run.workflowai.com";
  private readonly apiKey: string;
  private readonly endpoint = "/v1/@sergiowpfmecom/tasks/playlist-generator/schemas/1/run";

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_WORKFLOWAI_API_KEY || "";
    
    if (!this.apiKey) {
      console.warn("WorkflowAI API key not found. Please set NEXT_PUBLIC_WORKFLOWAI_API_KEY environment variable.");
    }
  }

  async generatePlaylist(
    prompt: string,
    options: {
      version?: "dev" | "prod";
      useCache?: "auto" | "always" | "never";
    } = {}
  ): Promise<PlaylistGenerationResult> {
    if (!this.apiKey) {
      throw new Error("WorkflowAI API key is required");
    }

    const { version = "dev", useCache = "auto" } = options;

    console.log("🎵 Generating playlist with WorkflowAI:", { prompt, version, useCache });

    const request: WorkflowAIRequest = {
      task_input: {
        prompt,
      },
      version,
      use_cache: useCache,
    };

    try {
      const response = await fetch(`${this.baseUrl}${this.endpoint}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ WorkflowAI API error:", {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        });
        
        throw new Error(
          `WorkflowAI API error: ${response.status} ${response.statusText}`
        );
      }

      const data: WorkflowAIResponse = await response.json();
      
      console.log("✅ WorkflowAI response received:", {
        playlistName: data.task_output.name,
        trackCount: data.task_output.songs.length,
      });

      // Transform the response to our expected format
      const result: PlaylistGenerationResult = {
        name: data.task_output.name,
        description: data.task_output.essay,
        tracks: data.task_output.songs.map(song => ({
          title: song.title,
          artist: song.artist,
        })),
      };

      return result;

    } catch (error) {
      console.error("❌ Error generating playlist:", error);
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error("Failed to generate playlist");
    }
  }

  /**
   * Check if the WorkflowAI service is properly configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Get service status information
   */
  getStatus() {
    return {
      configured: this.isConfigured(),
      baseUrl: this.baseUrl,
      endpoint: this.endpoint,
    };
  }
}

// Export singleton instance
export const workflowAIService = new WorkflowAIService();

// Export types for use in other files
export type { PlaylistGenerationResult, WorkflowAIRequest, WorkflowAIResponse }; 