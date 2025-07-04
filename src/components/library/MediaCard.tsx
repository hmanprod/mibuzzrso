// import { Media } from '@/types/database';
// import { TimeAgo } from '../ui/TimeAgo';
// import { Flame, PlayCircle } from "lucide-react";
// import { useState, useEffect, useCallback } from 'react';
// import { toast } from '@/components/ui/use-toast';
// import { useSession } from '@/components/providers/SessionProvider';
// import Image from 'next/image';
// import { getMediaLikes, toggleMediaLike } from '@/actions/interactions/interaction_mm';

// interface MediaCardProps {
//   media: Media;
//   onPlay: (media: Media) => void;
// }

// export function MediaCard({ media, onPlay }: MediaCardProps) {
//   const [isLiked, setIsLiked] = useState(false);
//   const [likesCount, setLikesCount] = useState(0);
//   const [isProcessing, setIsProcessing] = useState(false);
//   const { user } = useSession();

  
  
//   const fetchLikes = useCallback(async () => {
//     try {
//       const { count, isLiked, error } = await getMediaLikes(media.id);

//       if (error) {
//         console.error('Error fetching likes:', error);
//         return;
//       }

//       setLikesCount(count);
//       setIsLiked(isLiked);
//     } catch (error) {
//       console.error('Error fetching likes:', error);
//     }
//   }, [media.id])

//   useEffect(() => {
//     fetchLikes();
//   }, [media.id, user?.id, fetchLikes]);

//   const handlePlayClick = (e: React.MouseEvent) => {
//     e.stopPropagation();
//     onPlay(media);
//   };

//   const handleLikeClick = (e: React.MouseEvent) => {
//     e.stopPropagation();
//     if (isProcessing) return;

//     const newIsLiked = !isLiked;

//     // Optimistic UI update – effet immédiat pour une meilleure UX
//     setIsLiked(newIsLiked);
//     setLikesCount(prev => prev + (newIsLiked ? 1 : -1));
//     setIsProcessing(true);

//     // Appel réseau en arrière-plan
//     toggleMediaLike(media.id)
//       .then(({ error }) => {
//         if (error) {
//           // Rollback en cas d’échec
//           setIsLiked(!newIsLiked);
//           setLikesCount(prev => prev + (newIsLiked ? -1 : 1));
//           toast({
//             variant: "destructive",
//             title: "Error",
//             description: "Failed to toggle like",
//           });
//         }
//       })
//       .catch((error) => {
//         console.error('Error toggling like:', error);
//         setIsLiked(!newIsLiked);
//         setLikesCount(prev => prev + (newIsLiked ? -1 : 1));
//         toast({
//           variant: "destructive",
//           title: "Error",
//           description: "Failed to toggle like",
//         });
//       })
//       .finally(() => {
//         // Délai court pour autoriser les clics rapides même si le réseau est lent
//         setTimeout(() => setIsProcessing(false), 500);
//       });
//   };



//   return (
//     <div 
//       className="relative overflow-hidden rounded-lg shadow-md transition-all hover:shadow-lg group cursor-pointer"
//       onClick={handlePlayClick}
//     >
//       <div className="aspect-square overflow-hidden bg-[#333333] relative">
//         {/* Image de couverture */}
//         {media.media_cover_url && (
//           <div className="relative h-full w-full">
//             <Image
//               src={media.media_cover_url}
//               alt={media.title || 'Media cover'}
//               fill
//               className="object-cover transition-transform group-hover:scale-105"
//             />
//           </div>
//         )}

//         {/* Overlay noir semi-transparent */}
//         <div className="absolute inset-0 bg-black/40 transition-opacity group-hover:opacity-100"></div>

//         {/* Bouton Play au centre */}
//         <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white opacity-0 group-hover:opacity-100 transition-opacity">
//           <PlayCircle className="h-12 w-12" />
//         </div>

//         {/* Informations en overlay */}
//         <div className="absolute inset-0 p-4 flex flex-col justify-between text-white">
//           <div className="flex items-center gap-4 text-sm">
//             <TimeAgo date={media.created_at} />
//             <button 
//               onClick={handleLikeClick}
//               className="flex items-center gap-1 text-white hover:text-[#E94135] transition-colors"
//             >
//               <Flame className={`w-4 h-4 ${isLiked ? 'fill-[#E94135] text-[#E94135]' : ''}`} />
//               <span>{likesCount}</span>
//             </button>
//           </div>
//           <div className="flex items-center justify-between">
//             <div>
//           <h3 className="text-sm font-medium opacity-75 ">{media.title}</h3>
//           <h3 className="text-sm font-medium opacity-75 ">{media.profile?.stage_name || 'Unknown Artist'}</h3>
//             </div>
//             <span className="text-sm font-medium opacity-75">
//               {media.media_type === 'audio' ? 'Audio' : 'Vidéo'}
//             </span>
//           </div>
//         </div>
//       </div>

//       {/* Titre et description */}
//       {/* <div className="p-4 bg-white">
       
//         {media.description && (
//           <p className="text-sm text-gray-500 line-clamp-2">{media.description}</p>
//         )}
//       </div> */}
//     </div>
//   );
// }
