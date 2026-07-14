import pandas as pd
import matplotlib.pyplot as plt
from pathlib import Path


# ------------------------------------------------------------
# Kansei pair groups
# ------------------------------------------------------------

VISUAL_PAIRS = [
    "attractive_plain",
    "clear_confusing",
    "organized_disorganized",
    "comfortable_uncomfortable",
    "coherent_scattered",
]

CONTENT_PAIRS = [
    "professional_amateur",
    "understandable_confusing",
    "interesting_boring",
    "factual_misleading",
    "convincing_doubtful",
]

AUDIO_PAIRS = [
    "pleasant_unpleasant",
    "clear_unclear",
    "smooth_abrupt",
    "friendly_unfriendly",
    "motivating_demotivating",
]


# ------------------------------------------------------------
# Optional: remove duplicate participant-video rows
# ------------------------------------------------------------
# If duplicate submissions exist, this keeps only the last row
# for the same participant and same video.
#
# This assumes that duplicate rows are exact re-submissions or that
# the later row should be preferred.
# ------------------------------------------------------------

def remove_duplicate_participant_video_rows(df):
    required_cols = {"participant_id", "video_id"}

    if not required_cols.issubset(df.columns):
        print("Duplicate removal skipped: participant_id or video_id missing.")
        return df

    before = len(df)

    df_clean = df.drop_duplicates(
        subset=["participant_id", "video_id"],
        keep="last"
    ).copy()

    after = len(df_clean)

    print(f"Rows before duplicate removal: {before}")
    print(f"Rows after duplicate removal:  {after}")
    print(f"Removed duplicate rows:         {before - after}")

    return df_clean


# ------------------------------------------------------------
# Count score frequencies
# ------------------------------------------------------------

def make_score_frequency_table(df, kansei_pairs):
    """
    Return a dataframe where:
      index = scores from -3 to +3
      columns = Kansei pair names
      values = number of participant-video evaluations
    """
    scores = [-3, -2, -1, 0, 1, 2, 3]

    freq_df = pd.DataFrame(index=scores)

    for pair in kansei_pairs:
        if pair not in df.columns:
            print(f"Warning: column not found and skipped: {pair}")
            continue

        counts = (
            df[pair]
            .dropna()
            .astype(int)
            .value_counts()
            .reindex(scores, fill_value=0)
        )

        freq_df[pair] = counts

    freq_df.index.name = "score"

    return freq_df


# ------------------------------------------------------------
# Plot function
# ------------------------------------------------------------

def plot_kansei_score_distribution(
    df,
    kansei_pairs,
    title,
    output_path=None,
    show_right_y_axis=True,
):
    """
    Create a line graph showing the score frequency distribution
    for a group of Kansei pairs.
    """
    freq_df = make_score_frequency_table(df, kansei_pairs)

    fig, ax = plt.subplots(figsize=(10, 6))

    scores = freq_df.index.tolist()

    # Use a qualitative colormap with enough distinct colors.
    cmap = plt.get_cmap("tab10")

    for i, pair in enumerate(freq_df.columns):
        ax.plot(
            scores,
            freq_df[pair],
            marker="o",
            linewidth=2,
            label=pair,
            color=cmap(i % 10),
        )

    ax.set_title(title)
    ax.set_xlabel("Kansei score")
    ax.set_ylabel("Number of participant-video evaluations")
    ax.set_xticks(scores)
    ax.grid(True, axis="y", alpha=0.3)

    # Mirror the y-axis on the right for readability.
    # Important: this uses the same scale, not a different scale.
    if show_right_y_axis:
        ax_right = ax.twinx()
        ax_right.set_ylim(ax.get_ylim())
        ax_right.set_ylabel("Number of participant-video evaluations")
        ax_right.grid(False)

    ax.legend(
        title="Kansei pair",
        bbox_to_anchor=(1.12, 1),
        loc="upper left"
    )

    fig.tight_layout()

    if output_path:
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        fig.savefig(output_path, dpi=300, bbox_inches="tight")
        print(f"Saved figure: {output_path}")

    return fig, ax, freq_df


# ------------------------------------------------------------
# Example usage
# ------------------------------------------------------------
# Assumes you already created your flattened dataframe as df.
# For example:
#
# df = build_ratings_dataframe("data/results")
# ------------------------------------------------------------

# Optional but recommended if you have duplicate submissions:
#df_plot = remove_duplicate_participant_video_rows(df)

df_plot = pd.read_csv('participant_video_ratings.csv')

fig1, ax1, visual_freq = plot_kansei_score_distribution(
    df_plot,
    VISUAL_PAIRS,
    title="Score Distribution for Visual Impression Kansei Pairs",
    output_path="figures/kansei_visual_score_distribution.png",
)

fig2, ax2, content_freq = plot_kansei_score_distribution(
    df_plot,
    CONTENT_PAIRS,
    title="Score Distribution for Content Impression Kansei Pairs",
    output_path="figures/kansei_content_score_distribution.png",
)

fig3, ax3, audio_freq = plot_kansei_score_distribution(
    df_plot,
    AUDIO_PAIRS,
    title="Score Distribution for Audio/Narrator Impression Kansei Pairs",
    output_path="figures/kansei_audio_score_distribution.png",
)

plt.show()