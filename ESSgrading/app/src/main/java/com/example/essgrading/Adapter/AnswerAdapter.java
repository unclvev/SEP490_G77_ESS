package com.example.essgrading.Adapter;

import android.graphics.Color;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import com.example.essgrading.R;
import java.util.List;

public class AnswerAdapter extends RecyclerView.Adapter<AnswerAdapter.AnswerViewHolder> {

    private List<int[]> answerData;

    public AnswerAdapter(List<int[]> answerData) {
        this.answerData = answerData;
    }

    @NonNull
    @Override
    public AnswerViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_answer, parent, false);
        return new AnswerViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull AnswerViewHolder holder, int position) {
        holder.txtQuestionNumber.setText(String.valueOf(position)); // Hiển thị số thứ tự câu hỏi

        for (int i = 0; i < 4; i++) { // Duyệt qua A, B, C, D
            if (answerData.get(position)[i] == 1) {
                holder.answerChoices[i].setBackgroundResource(R.drawable.circle_background_correctanswer);
                holder.answerChoices[i].setTextColor(Color.WHITE);
            } else {
                holder.answerChoices[i].setBackgroundResource(R.drawable.circle_background_answer);
                holder.answerChoices[i].setTextColor(Color.BLACK);
            }
        }
    }


    @Override
    public int getItemCount() {
        return answerData.size();
    }

    public static class AnswerViewHolder extends RecyclerView.ViewHolder {
        TextView txtQuestionNumber;
        TextView[] answerChoices = new TextView[4];

        public AnswerViewHolder(@NonNull View itemView) {
            super(itemView);
            txtQuestionNumber = itemView.findViewById(R.id.txtQuestionNumber);
            answerChoices[0] = itemView.findViewById(R.id.txtAnswerA);
            answerChoices[1] = itemView.findViewById(R.id.txtAnswerB);
            answerChoices[2] = itemView.findViewById(R.id.txtAnswerC);
            answerChoices[3] = itemView.findViewById(R.id.txtAnswerD);
        }
    }
}
