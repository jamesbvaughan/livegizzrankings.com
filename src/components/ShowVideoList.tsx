"use client";

import { useState } from "react";
import { BoxedInput } from "./BoxedInput";
import { BoxedButton } from "./BoxedButtonLink";
import { extractYouTubeVideoId } from "@/lib/extractEmbedCodes";

interface Video {
  youtubeVideoId: string;
  title: string;
}

interface VideoRowProps {
  video: Video;
  index: number;
  onUpdate: (index: number, field: keyof Video, value: string) => void;
  onRemove: (index: number) => void;
}

function VideoRow({ video, index, onUpdate, onRemove }: VideoRowProps) {
  return (
    <div className="flex gap-2">
      <div className="flex-1">
        <BoxedInput
          label={`Video ${index + 1} - Title`}
          id={`video-title-${index}`}
          name={`video-title-${index}`}
          type="text"
          value={video.title}
          onChange={(e) => {
            onUpdate(index, "title", e.target.value);
          }}
          placeholder="e.g. Night 1"
          required={video.youtubeVideoId !== ""}
        />
      </div>
      <div className="flex-1">
        <BoxedInput
          label={`Video ${index + 1} - YouTube URL`}
          id={`video-id-${index}`}
          name={`video-id-${index}`}
          type="text"
          value={video.youtubeVideoId}
          onChange={(e) => {
            const extractedId = extractYouTubeVideoId(e.target.value);
            onUpdate(index, "youtubeVideoId", extractedId);
          }}
          placeholder="e.g. https://youtube.com/watch?v=dQw4w9WgXcQ"
          required={video.title !== ""}
        />
      </div>
      <div className="flex items-end">
        <BoxedButton
          type="button"
          onClick={() => {
            onRemove(index);
          }}
        >
          Remove
        </BoxedButton>
      </div>
    </div>
  );
}

interface ShowVideoListProps {
  defaultVideos?: Video[];
}

const noVideos: Video[] = [];

export function ShowVideoList({
  defaultVideos = noVideos,
}: ShowVideoListProps) {
  const [videos, setVideos] = useState<Video[]>(
    defaultVideos.length > 0 ? defaultVideos : [],
  );

  const addVideo = () => {
    setVideos([...videos, { youtubeVideoId: "", title: "" }]);
  };

  const removeVideo = (index: number) => {
    setVideos(videos.filter((_, i) => i !== index));
  };

  const updateVideo = (index: number, field: keyof Video, value: string) => {
    const newVideos = [...videos];
    newVideos[index][field] = value;
    setVideos(newVideos);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="block font-semibold">YouTube Videos</p>
        <p className="text-muted text-sm">
          Add multiple YouTube videos for this show. Each video needs a title
          and YouTube URL.
        </p>
      </div>

      {videos.map((video, index) => (
        <VideoRow
          // eslint-disable-next-line react/no-array-index-key
          key={index}
          video={video}
          index={index}
          onUpdate={updateVideo}
          onRemove={removeVideo}
        />
      ))}

      <BoxedButton type="button" onClick={addVideo}>
        Add Video
      </BoxedButton>

      {/* Hidden input containing JSON of all videos */}
      <input
        type="hidden"
        name="videos"
        value={JSON.stringify(
          videos.filter((v) => v.youtubeVideoId && v.title),
        )}
      />
    </div>
  );
}
