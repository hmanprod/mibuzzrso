"use server";

import { createClient } from "@/lib/supabase/server";
import { Profile } from "@/types/database";
import { revalidatePath } from "next/cache";
import {
  addPointsForMedia,
  addPointsForChallenge,
} from "@/actions/pointss/actions";
import { encryptUrl } from "@/utils/encryption.utils";

// export interface Challenge {
//   id: string;
//   title: string;
//   description: string;
//   description_short: string;
//   status: 'draft' | 'active' | 'completed';
//   type: 'remix' | 'live_mix';
//   voting_type: 'public' | 'jury';
//   end_at: string;
//   winner_uid?: string;
//   winner_displayname?: string;
//   participants_count: number;
//   winning_prize?: string;
//   visual_url?: string;
//   youtube_iframe?: string;
//   medias: Media[];
//   created_at: string;
//   updated_at: string;
//   user_id: string;
//   user?: {
//     id: string;
//     stage_name?: string;
//     avatar_url?: string;
//   };
// }

export interface Comment {
  id: string;
  content: string;
  player_time: number;
  created_at: string;
  parent_comment_id: string | null;
  author: {
    id: string;
    stage_name: string;
    avatar_url: string;
    username: string;
    pseudo_url: string;
  };
}

export interface TransformedComment {
  id: string;
  content: string;
  timestamp: number;
  created_at: string;
  parent_comment_id: string | null;
  author: {
    id: string;
    stage_name: string;
    avatar_url: string;
    username: string;
    pseudo_url: string;
  };
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  description_short: string;
  status: "draft" | "active" | "completed";
  type: "remix" | "live_mix";
  voting_type: "public" | "jury";
  end_at: string;
  winner_uid?: string;
  winner_displayname?: string;
  participants_count: number;
  winning_prize?: string;
  visual_url?: string;
  youtube_iframe?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  is_liked?: boolean;
  likes: number;
  user: {
      id: string;
      stage_name?: string;
      avatar_url?: string; 
  };
}

// Ajoutez cette interface au début du fichier, avec les autres interfaces
export interface ChallengeData {
  id: string;
  title: string;
  description: string;
  description_short: string;
  status: string;
  type: string;
  voting_type: string;
  end_at: string;
  winner_uid: string | null;
  winner_displayname?: string;
  participants_count: number;
  winning_prize?: string;
  visual_url?: string;
  youtube_iframe?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  is_liked: boolean;
  likes_count: number;
  creator_data: {
    id: string;
    stage_name?: string;
    avatar_url?: string;
    pseudo_url?: string;
  };
}

export async function getChallenges(
  page: number = 1,
  limit: number = 5,
  status: "active" | "completed" | "all" = "all"
) {
  const supabase = await createClient();

  try {
    let query = supabase
      .from("challenges")
      .select(
        `
        *,
        user:profiles!user_id (
          id,
          stage_name,
          avatar_url
        )
      `
      )
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (status !== "all") {
      query = query.eq("status", status);
    } else {
      query = query.neq("status", "draft");
    }

    const { data: challenges, error } = await query;

    if (error) {
      console.error("Error fetching challenges:", error);
      return { error: "Failed to load challenges" };
    }

    // Get total count for pagination
    let countQuery = supabase
      .from("challenges")
      .select("*", { count: "exact", head: true });

    if (status !== "all") {
      countQuery = countQuery.eq("status", status);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error("Error getting challenges count:", countError);
    }

    return {
      challenges,
      total: count || 0,
      page,
      limit,
    };
  } catch (error) {
    console.error("Error in getChallenges:", error);
    return { error: "An unexpected error occurred" };
  }
}

export async function isUserJury(challengeId: string, userId: string) {
  const supabase = await createClient();
  const { data: jury, error } = await supabase
    .from("challenge_jury")
    .select("*")
    .eq("challenge_id", challengeId)
    .eq("user_id", userId)
    .single();

  if (error) return false;
  return !!jury;
}

// export async function getChallenge(id: string) {
//   const supabase = await createClient();
//   // console.log('Fetching challenge with ID:', id);

//   try {
//     // 1. Récupérer le challenge
//     const { data: challenge, error: challengeError } = await supabase
//       .from('challenges')
//       .select('*')
//       .eq('id', id)
//       .single();

//     if (challengeError) {
//       console.error('Error fetching challenge:', challengeError);
//       return { error: 'Failed to load challenge', details: challengeError };
//     }

//     if (!challenge) {
//       return { error: 'Challenge not found' };
//     }

//     // 2. Récupérer le profil
//     const { data: profile, error: profileError } = await supabase
//       .from('profiles')
//       .select('*')
//       .eq('id', challenge.user_id)
//       .single();

//     if (profileError) {
//       console.error('Error fetching profile:', profileError);
//       // On continue même si on ne trouve pas le profil
//     }

//     // Combiner les données
//     return {
//       challenge: {
//         ...challenge,
//         creator: {
//           id: challenge.user_id,
//           profile: profile || null
//         }
//       }
//     };
//   } catch (error) {
//     console.error('Error in getChallenge:', error);
//     return { error: 'An unexpected error occurred' };
//   }
// }

export async function getChallenge(id: string): Promise<{
  challengeData?: ChallengeData;
  error?: string;
}> {
  const supabase = await createClient();

  try {
    // Get current user for like status
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = user?.id;

    // Call the get_challenge function
    const { data: challengeData, error } = await supabase
      .rpc("get_challenge", {
        p_challenge_id: id,
        p_current_user_id: userId || null,
      })
      .single();


    if (error) {
      console.error("Error fetching challenge:", error);
      return { error: "Failed to load challenge" };
    }

    if (!challengeData) {
      return { error: "Challenge not found" };
    }

    const challengeDataTyped = challengeData as ChallengeData;

    return { challengeData: challengeDataTyped };
  } catch (error) {
    console.error("Error in getChallenge:", error);
    return { error: "An unexpected error occurred" };
  }
}

export interface ChallengeMedia {
  id: string;
  position: number;
  media: {
    id: string;
    media_type: "audio" | "video";
    media_url: string;
    media_cover_url?: string;
    media_public_id: string;
    duration?: number;
    title?: string;
    description?: string;
    user_id: string;
    created_at: string;
    updated_at: string;
  };
}

interface ChallengeMediasResponse {
  medias?: ChallengeMedia[];
  error?: string;
  details?: {
    code?: string;
    message?: string;
    hint?: string;
  };
}



export async function getChallengeMedias(
  challengeId: string
): Promise<ChallengeMediasResponse> {
  const supabase = await createClient();
  // console.log('Fetching medias for challenge:', challengeId);

  try {
    const { data: rawMedias, error } = await supabase
      .from("challenges_medias")
      .select(
        `
        id,
        position,
        media:medias!inner(
          id,
          media_type,
          media_url,
          media_cover_url,
          media_public_id,
          duration,
          title,
          description,
          user_id,
          created_at,
          updated_at
        )
      `
      )
      .eq("challenge_id", challengeId)
      .order("position");

    // Transformer les données pour avoir le bon format
    const medias = rawMedias?.map((item) => {
      const mediaData = Array.isArray(item.media) ? item.media[0] : item.media;

      return {
        id: item.id,
        position: item.position,
        media: {
          id: mediaData.id,
          media_type: mediaData.media_type as "audio" | "video",
          media_url: mediaData.media_url,
          media_cover_url: mediaData.media_cover_url,
          media_public_id: mediaData.media_public_id,
          duration: mediaData.duration,
          title: mediaData.title,
          description: mediaData.description,
          user_id: mediaData.user_id,
          created_at: mediaData.created_at,
          updated_at: mediaData.updated_at,
        },
        comments: [],
      };
    }) as ChallengeMedia[];

    if (error) {
      console.error("Error fetching challenge medias:", error);
      return { error: "Failed to load challenge medias", details: error };
    }

    return { medias: medias as ChallengeMedia[] };
  } catch (error) {
    console.error("Error in getChallengeMedias:", error);
    return { error: "An unexpected error occurred" };
  }
}

export interface CreateChallengeData {
  voting_type: "public" | "jury";
  title: string;
  description: string;
  type: "remix" | "live_mix";
  endAt: string;
  winningPrize?: string;
  userId: string;
  juryMembers: Array<{
    id: string;
    stage_name?: string;
    avatar_url?: string;
  }>;
  medias: Array<{
    url: string;
    publicId: string;
    type: string;
    duration?: number;
    cover_url: string;
  }>;
}

export async function addMediaToChallenge(
  challengeId: string
): Promise<ChallengeMediasResponse> {
  const supabase = await createClient();

  try {
    const { data: rawMedias, error } = await supabase
      .from("challenges_medias")
      .select(
        `
        id,
        position,
        media:medias!inner(
          id,
          media_type,
          media_url,
          media_cover_url,
          media_public_id,
          duration,
          title,
          description,
          user_id,
          created_at,
          updated_at
        )
      `
      )
      .eq("challenge_id", challengeId)
      .order("position");

    // Transformer les données pour avoir le bon format
    const medias = rawMedias?.map((item) => {
      const mediaData = Array.isArray(item.media) ? item.media[0] : item.media;

      return {
        id: item.id,
        position: item.position,
        media: {
          id: mediaData.id,
          media_type: mediaData.media_type as "audio" | "video",
          media_url: mediaData.media_url,
          media_cover_url: mediaData.media_cover_url,
          media_public_id: mediaData.media_public_id,
          duration: mediaData.duration,
          title: mediaData.title,
          description: mediaData.description,
          user_id: mediaData.user_id,
          created_at: mediaData.created_at,
          updated_at: mediaData.updated_at,
        },
        comments: [],
      };
    }) as ChallengeMedia[];

    if (error) {
      console.error("Error fetching challenge medias:", error);
      return { error: "Failed to load challenge medias", details: error };
    }

    return { medias: medias as ChallengeMedia[] };
  } catch (error) {
    console.error("Error in addMediaToChallenge:", error);
    return { error: "An unexpected error occurred" };
  }
}

export async function createChallenge(data: CreateChallengeData) {
  const supabase = await createClient();

  try {
   const mediasToInsert = data.medias.map((media) => ({
     ...media,
     media_url: encryptUrl(media.url),
   }));

    // 1. Create the challenge
    const { data: challenge, error: challengeError } = await supabase
      .from("challenges")
      .insert({
        title: data.title,
        description: data.description,
        type: data.type,
        voting_type: data.voting_type,
        status: "active",
        end_at: data.endAt,
        winning_prize: data.winningPrize,
        user_id: data.userId,
        participants_count: 0,
      })
      .select()
      .single();

    if (challengeError || !challenge) {
      console.error("Error creating challenge:", challengeError);
      return {
        success: false,
        error: "Failed to create challenge",
        details: challengeError,
      };
    }

    // 2. Add jury members if voting_type is 'jury'
    if (data.voting_type === "jury" && data.juryMembers?.length > 0) {
      const { error: juryError } = await supabase.from("challenge_jury").insert(
        data.juryMembers.map((jury) => ({
          challenge_id: challenge.id,
          user_id: jury.id,
        }))
      );

      if (juryError) {
        console.error("Error adding jury members:", juryError);
        return {
          success: false,
          error: "Failed to add jury members",
          details: juryError,
        };
      }
    }

    // 3. Add medias if any
    if (data.medias?.length > 0) {
      // Create media records
      const { data: medias, error: mediasError } = await supabase
        .from("medias")
        .insert(
          mediasToInsert.map((media) => ({
            media_type: media.type as "audio" | "video",
            media_url: media.url,
            media_public_id: media.publicId,
            media_cover_url: media.cover_url,
            duration: media.duration,
            user_id: data.userId,
          }))
        )
        .select();

      if (mediasError || !medias) {
        console.error("Database error creating medias:", mediasError);
        return {
          success: false,
          error: "Failed to create media",
          details: mediasError,
        };
      }

      // Link medias to challenge
      const { error: linkError } = await supabase
        .from("challenges_medias")
        .insert(
          medias.map((media, index) => ({
            challenge_id: challenge.id,
            media_id: media.id,
            position: index,
          }))
        );

      if (linkError) {
        console.error("Database error linking medias:", linkError);
        return {
          success: false,
          error: "Failed to link media to challenge",
          details: linkError,
        };
      }
    }

    revalidatePath("/feed/challenges");
    return { success: true, challenge };
  } catch (error: unknown) {
    console.error("Error creating challenge:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create challenge";
    return {
      success: false,
      error: errorMessage,
      details: error,
    };
  }
}

interface ParticipationSubmission {
  challengeId: string;
  userId: string;
  mediaUrl: string;
  mediaPublicId: string;
  mediaType: "audio" | "video";
  duration?: number;
}

export async function participateInChallenge(
  submission: ParticipationSubmission
) {
  const supabase = await createClient();

  try {
    // 1. Verify challenge is active and user hasn't participated yet
    const [
      { data: challenge, error: challengeError },
      { data: existingParticipation, error: participationError },
    ] = await Promise.all([
      supabase
        .from("challenges")
        .select("status")
        .eq("id", submission.challengeId)
        .single(),
      supabase
        .from("challenge_participations")
        .select("id")
        .eq("challenge_id", submission.challengeId)
        .eq("user_id", submission.userId)
        .maybeSingle(),
    ]);

    if (challengeError) {
      throw challengeError;
    }

    if (participationError) {
      throw participationError;
    }

    if (existingParticipation) {
      return { error: "You have already participated in this challenge" };
    }

    if (challenge.status !== "active") {
      return { error: "This challenge is not active" };
    }

    // 2. Create media record
    const { data: mediaData, error: mediaError } = await supabase
      .from("medias")
      .insert({
        media_type: submission.mediaType,
        media_url: submission.mediaUrl,
        media_public_id: submission.mediaPublicId,
        duration: submission.duration,
        user_id: submission.userId,
      })
      .select()
      .single();

    if (mediaError) {
      throw mediaError;
    }

    // 3. Create participation record with media
    const { error: insertParticipationError } = await supabase
      .from("challenge_participations")
      .insert({
        challenge_id: submission.challengeId,
        user_id: submission.userId,
        audio_url: submission.mediaUrl, // Pour la compatibilité avec le schéma existant
      });

    if (insertParticipationError) {
      throw insertParticipationError;
    }

    // 4. Get the last position
    const { data: lastPosition, error: positionError } = await supabase
      .from("challenges_medias")
      .select("position")
      .eq("challenge_id", submission.challengeId)
      .order("position", { ascending: false })
      .limit(1);

    if (positionError) {
      throw positionError;
    }

    // 5. Link media to challenge with next position
    const nextPosition =
      lastPosition && lastPosition.length > 0
        ? lastPosition[0].position + 1
        : 0;

    const { error: linkError } = await supabase
      .from("challenges_medias")
      .insert({
        challenge_id: submission.challengeId,
        media_id: mediaData.id,
        position: nextPosition,
      });

    if (linkError) {
      throw linkError;
    }

    // 5. Increment participants count (géré par le trigger)

    // 6. Ajouter les points
    await Promise.all([
      addPointsForMedia(mediaData.id), // Points pour le nouveau média
      addPointsForChallenge(mediaData.id, submission.challengeId), // Points pour la participation
    ]);

    revalidatePath("/feed/challenges");
    return { success: true, mediaId: mediaData.id };
  } catch (error) {
    console.error("Error participating in challenge:", error);
    return { error: "Failed to participate in challenge" };
  }
}

interface CommentResponse {
  comments?: TransformedComment[];
  error?: string;
}

export async function getChallengeComments(challengeId: string): Promise<CommentResponse> {
  const supabase = await createClient();

  try {
    const { data: commentsData, error } = await supabase
      .from("comments")
      .select("*")
      .eq("challenge_id", challengeId)
      .order("created_at", { ascending: false });

    // console.log("commentsData", commentsData);


    if (error) {
      console.error("Error fetching challenge comments:", error);
      return { error: "Failed to load comments" };
    }

    // Get all user IDs from comments
    const userIds = commentsData?.map((comment) => comment.user_id) || [];

    // Fetch profiles for these users
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .in("id", userIds);

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      return { error: "Failed to load user profiles" };
    }

    // Create a map of user_id to profile for easy lookup
    const profilesMap = (profilesData || []).reduce((acc, profile) => {
      acc[profile.id] = profile;
      return acc;
    }, {} as Record<string, Profile>);

    // Transform the data to match our comments interface
    const transformedComments = commentsData?.map((comment) => {
      const profile = profilesMap[comment.user_id] || {};

      return {
        id: comment.id,
        content: comment.content,
        timestamp: comment.player_time || 0,
        created_at: comment.created_at,
        parent_comment_id: comment.parent_comment_id,
        author: {
          id: profile.id || comment.user_id,
          stage_name: profile.stage_name || "",
          avatar_url: profile.avatar_url,
          username: profile.email || "User",
          pseudo_url: profile.pseudo_url || "User",
        },
      };
    }) || [];

    return { comments: transformedComments };
  } catch (error) {
    console.error("Error in getChallengeComments:", error);
    return { error: "An unexpected error occurred" };
  }
}

export async function updateChallengeParticipationCount(challengeId: string) {
  const supabase = await createClient();

  try {
    // Get the current count first
    const { data: challenge, error: fetchError } = await supabase
      .from("challenges")
      .select("participants_count")
      .eq("id", challengeId)
      .single();

    if (fetchError) {
      console.error("Error fetching challenge count:", fetchError);
      return { error: "Could not fetch challenge to update count." };
    }

    const current_count = challenge.participants_count || 0;
    const new_count = current_count + 1;

    // Update with the new incremented count
    const { data, error } = await supabase
      .from("challenges")
      .update({ participants_count: new_count })
      .eq("id", challengeId)
      .select("participants_count")
      .single();

    if (error) {
      console.error("Error updating challenge participation count:", error);
      return { error: "Failed to update challenge participation count" };
    }

    return { count: data.participants_count };
  } catch (error) {
    console.error("Error in updateChallengeParticipationCount:", error);
    return { error: "An unexpected error occurred" };
  }
}

