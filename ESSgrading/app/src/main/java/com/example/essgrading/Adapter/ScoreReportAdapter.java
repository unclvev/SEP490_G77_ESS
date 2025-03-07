package com.example.essgrading.Adapter;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import com.example.essgrading.Model.ScoreModel;
import com.example.essgrading.R;
import java.util.List;

public class ScoreReportAdapter extends RecyclerView.Adapter<ScoreReportAdapter.ScoreViewHolder> {

    private List<ScoreModel> scoreList;

    public ScoreReportAdapter(List<ScoreModel> scoreList) {
        this.scoreList = scoreList;
    }

    @NonNull
    @Override
    public ScoreViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_score, parent, false);
        return new ScoreViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ScoreViewHolder holder, int position) {
        ScoreModel score = scoreList.get(position);
        holder.txtStudentName.setText(score.getStudentName());
        holder.txtStudentId.setText(score.getStudentId());
        holder.txtStudentScore.setText(String.valueOf(score.getScore()));
    }

    @Override
    public int getItemCount() {
        return scoreList.size();
    }

    public static class ScoreViewHolder extends RecyclerView.ViewHolder {
        TextView txtStudentName, txtStudentId, txtStudentScore;

        public ScoreViewHolder(@NonNull View itemView) {
            super(itemView);
            txtStudentName = itemView.findViewById(R.id.txtStudentName);
            txtStudentId = itemView.findViewById(R.id.txtStudentId);
            txtStudentScore = itemView.findViewById(R.id.txtStudentScore);
        }
    }
}
