package com.example.essgrading.Adapter;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import com.example.essgrading.R;
import java.util.List;

public class ExCodeAdapter extends RecyclerView.Adapter<ExCodeAdapter.ExCodeViewHolder> {

    private List<String> exCodeList;
    private OnItemClickListener onItemClickListener;

    public interface OnItemClickListener {
        void onItemClick(String selectedExCode);
    }

    public ExCodeAdapter(List<String> exCodeList, OnItemClickListener listener) {
        this.exCodeList = exCodeList;
        this.onItemClickListener = listener;
    }

    @NonNull
    @Override
    public ExCodeViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_excode, parent, false);
        return new ExCodeViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ExCodeViewHolder holder, int position) {
        String exCode = exCodeList.get(position);
        holder.btnExCode.setText(exCode);

        holder.btnExCode.setOnClickListener(v -> {
            if (onItemClickListener != null) {
                onItemClickListener.onItemClick(exCode);
            }
        });
    }

    @Override
    public int getItemCount() {
        return exCodeList.size();
    }

    public static class ExCodeViewHolder extends RecyclerView.ViewHolder {
        Button btnExCode;

        public ExCodeViewHolder(@NonNull View itemView) {
            super(itemView);
            btnExCode = itemView.findViewById(R.id.btnExCode);
        }
    }
}
