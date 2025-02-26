package com.example.essgrading.Adapter;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import com.example.essgrading.Model.ClassModel;
import com.example.essgrading.R;
import java.util.List;

public class ClassAdapter extends RecyclerView.Adapter<ClassAdapter.ClassViewHolder> {

    private List<ClassModel> classList;

    public ClassAdapter(List<ClassModel> classList) {
        this.classList = classList;
    }

    @NonNull
    @Override
    public ClassViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_class, parent, false);
        return new ClassViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ClassViewHolder holder, int position) {
        ClassModel classModel = classList.get(position);
        holder.txtClassCode.setText(classModel.getClassCode());
        holder.txtStudentCount.setText("Học sinh: " + classModel.getStudentCount());
        holder.txtClassDate.setText("Ngày tạo " + classModel.getCreatedDate());
    }

    @Override
    public int getItemCount() {
        return classList.size();
    }

    public static class ClassViewHolder extends RecyclerView.ViewHolder {
        TextView txtClassCode, txtStudentCount, txtClassDate;

        public ClassViewHolder(@NonNull View itemView) {
            super(itemView);
            txtClassCode = itemView.findViewById(R.id.txtClassCode);
            txtStudentCount = itemView.findViewById(R.id.txtStudentCount);
            txtClassDate = itemView.findViewById(R.id.txtClassDate);
        }
    }
}
