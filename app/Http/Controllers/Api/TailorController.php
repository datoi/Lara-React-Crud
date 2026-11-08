<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\TailorWork;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/**
 * The tailor's own profile. Kere publishes nothing about its tailors and
 * customers cannot choose one (terms §3, privacy policy §4.2), so there is no
 * public list or profile; what a tailor fills in here is for Kere's own use.
 */
class TailorController extends Controller
{
    /** The profile as saved. The tailor's score is /api/tailor/stats (Review::scoresForTailors), not this. */
    private function tailorData(User $tailor): array
    {
        return [
            'id'               => $tailor->id,
            'name'             => $tailor->getFullName(),
            'bio'              => $tailor->bio,
            'specialty'        => $tailor->specialty,
            'years_experience' => $tailor->years_experience,
            'profile_image'    => $tailor->profile_image,
            'is_available'     => (bool) ($tailor->is_available ?? true),
            'turnaround_days'  => $tailor->turnaround_days,
            'does_remodeling'  => (bool) $tailor->does_remodeling,
            // Null until they have answered the questionnaire.
            'work_preferences' => $tailor->work_preferences,
        ];
    }

    /** Only an approved tailor has a profile to read or edit. */
    private function refusal(User $user): ?JsonResponse
    {
        if ($user->role !== 'tailor') {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        if ($user->approval_status === 'pending' || $user->approval_status === 'rejected') {
            return response()->json(['message' => 'Your account is pending approval.', 'code' => 'pending_approval'], 403);
        }

        return null;
    }

    // ─── GET /api/tailor/profile ──────────────────────────────────────────────

    /**
     * The profile the editor starts from. It must load before the editor
     * saves, or saving would write an empty form over the tailor's profile.
     */
    public function show(Request $request)
    {
        return $this->refusal($request->user())
            ?? response()->json(['tailor' => $this->tailorData($request->user())]);
    }

    // ─── PATCH /api/tailor/profile ────────────────────────────────────────────

    public function updateProfile(Request $request)
    {
        $user = $request->user();
        if ($refused = $this->refusal($user)) {
            return $refused;
        }

        // Minor #16: max years_experience is dynamic (current year − 1960)
        $maxExperience = (int) date('Y') - 1960;

        $data = $request->validate([
            'bio'              => 'nullable|string|max:1000',
            'specialty'        => 'nullable|string|max:200',
            'years_experience' => "nullable|integer|min:0|max:{$maxExperience}",
            'profile_image'    => 'nullable|string|max:2000',
            // Whether they take remodel or design work follows these answers;
            // it is not set on its own any more. Checked only when sent, so the
            // profile editor can save without them.
            ...($request->has('work_preferences') ? TailorWork::rules('work_preferences') : []),
        ]);

        if (array_key_exists('work_preferences', $data)) {
            [$answers, $incomplete] = TailorWork::normalize($data['work_preferences']);
            if ($incomplete) {
                throw ValidationException::withMessages(["work_preferences.{$incomplete}" => 'work_answer_required']);
            }
            unset($data['work_preferences']);
            $data += TailorWork::attributes($answers);
        }

        $user->update($data);

        return response()->json(['tailor' => $this->tailorData($user)]);
    }
}
