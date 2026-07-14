import pandas as pd
import matplotlib.pyplot as plt
from pathlib import Path


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


def make_video_score_frequency_table(df, video_id, kansei_pairs):
    """
    For one video, count how many participants selected each score
    from -3 to +3 for each Kansei pair.

    Returns:
        DataFrame where:
        - index = scores -3 to +3
        - columns = Kansei pair names
        - values = number of participants
    """
    scores = [-3, -2, -1, 0, 1, 2, 3]

    video_df = df[df["video_id"] == video_id].copy()

    if video_df.empty:
        raise ValueError(f"No rows found for video_id={video_id}")

    freq_df = pd.DataFrame(index=scores)

    for pair in kansei_pairs:
        if pair not in video_df.columns:
            print(f"Warning: missing column skipped: {pair}")
            continue

        counts = (
            video_df[pair]
            .dropna()
            .astype(int)
            .value_counts()
            .reindex(scores, fill_value=0)
        )

        freq_df[pair] = counts

    freq_df.index.name = "score"
    return freq_df


def plot_video_kansei_distribution(
    df,
    video_id,
    kansei_pairs,
    section_title,
    output_path=None,
    show_right_y_axis=True,
):
    """
    Plot score distribution for one video and one group of Kansei pairs.
    """
    video_rows = df[df["video_id"] == video_id]

    if video_rows.empty:
        raise ValueError(f"No data found for video_id={video_id}")

    video_title = video_rows["video_title"].iloc[0]
    video_topic = video_rows["video_topic"].iloc[0]
    n_participants = video_rows["participant_id"].nunique()

    freq_df = make_video_score_frequency_table(df, video_id, kansei_pairs)

    fig, ax = plt.subplots(figsize=(10, 6))

    scores = freq_df.index.tolist()
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

    ax.set_title(
        f"{section_title}\n"
        f"{video_title} ({video_id}) — {video_topic}"
    )
    ax.set_xlabel("Kansei score")
    ax.set_ylabel("Number of participants")
    ax.set_xticks(scores)

    # The maximum possible count is the number of participants
    # who rated this video.
    ax.set_ylim(0, n_participants)

    ax.grid(True, axis="y", alpha=0.3)

    if show_right_y_axis:
        ax_right = ax.twinx()
        ax_right.set_ylim(ax.get_ylim())
        ax_right.set_ylabel("Number of participants")
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


def plot_all_sections_for_video(df, video_id, output_dir="figures/by_video"):
    """
    Generate three plots for one selected video:
    visual, content, and audio/narrator.
    """
    output_dir = Path(output_dir)

    fig1, ax1, visual_freq = plot_video_kansei_distribution(
        df=df,
        video_id=video_id,
        kansei_pairs=VISUAL_PAIRS,
        section_title="Visual Impression Kansei Score Distribution",
        output_path=output_dir / f"{video_id}_visual_distribution.png",
    )

    fig2, ax2, content_freq = plot_video_kansei_distribution(
        df=df,
        video_id=video_id,
        kansei_pairs=CONTENT_PAIRS,
        section_title="Content Impression Kansei Score Distribution",
        output_path=output_dir / f"{video_id}_content_distribution.png",
    )

    fig3, ax3, audio_freq = plot_video_kansei_distribution(
        df=df,
        video_id=video_id,
        kansei_pairs=AUDIO_PAIRS,
        section_title="Audio/Narrator Impression Kansei Score Distribution",
        output_path=output_dir / f"{video_id}_audio_distribution.png",
    )

    return {
        "visual": visual_freq,
        "content": content_freq,
        "audio": audio_freq,
    }


# ------------------------------------------------------------
# Example usage
# ------------------------------------------------------------
# df = build_ratings_dataframe("data/results")
df_plot = pd.read_csv('participant_video_ratings.csv')

# Generate three plots for one video
freq_tables = plot_all_sections_for_video(
    df_plot,
    video_id="H01",
    output_dir="figures/by_video"
)

plt.show()