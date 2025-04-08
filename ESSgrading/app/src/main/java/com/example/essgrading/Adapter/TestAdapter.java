package com.example.essgrading.Adapter;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import com.example.essgrading.Model.TestModel;
import com.example.essgrading.R;
import java.util.List;

public class TestAdapter extends RecyclerView.Adapter<TestAdapter.TestViewHolder> {

    private List<TestModel> testList;
    private Context context;
    private OnItemClickListener onItemClickListener;

    public interface OnItemClickListener {
        void onItemClick(TestModel selectedTest);
    }

    public TestAdapter(Context context, List<TestModel> testList, OnItemClickListener listener) {
        this.context = context;
        this.testList = testList;
        this.onItemClickListener = listener;
    }

    @NonNull
    @Override
    public TestViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_test, parent, false);
        return new TestViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull TestViewHolder holder, int position) {
        TestModel test = testList.get(position);
        holder.txtTestTitle.setText(test.getTitle());
        holder.txtClassCode.setText(test.getClassCode());
        holder.txtTestType.setText(test.getTestType());
        holder.txtTestDate.setText(test.getDate());

        // Sự kiện click vào bài kiểm tra
        holder.itemView.setOnClickListener(v -> {
            if (onItemClickListener != null) {
                onItemClickListener.onItemClick(test);
            }
        });
    }

    @Override
    public int getItemCount() {
        return testList.size();
    }

    public static class TestViewHolder extends RecyclerView.ViewHolder {
        TextView txtTestTitle, txtClassCode, txtTestType, txtTestDate;

        public TestViewHolder(@NonNull View itemView) {
            super(itemView);
            txtTestTitle = itemView.findViewById(R.id.txtTestTitle);
            txtClassCode = itemView.findViewById(R.id.txtTestCode);
            txtTestType = itemView.findViewById(R.id.txtTestType);
            txtTestDate = itemView.findViewById(R.id.txtTestDate);
        }
    }
}
