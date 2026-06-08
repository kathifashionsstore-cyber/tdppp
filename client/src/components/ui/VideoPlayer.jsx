const toEmbed = (url = '') => {
  const id = url.match(/(?:v=|youtu\.be\/|embed\/)([^&?/]+)/)?.[1];
  return id ? `https://www.youtube.com/embed/${id}` : url;
};

const VideoPlayer = ({ url, title }) => (
  <div className="aspect-video overflow-hidden rounded-lg bg-black">
    <iframe className="h-full w-full" src={toEmbed(url)} title={title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
  </div>
);

export default VideoPlayer;
