package com.example.essgrading.Activity.Test;

import android.content.Intent;
import android.os.Bundle;
import android.widget.TextView;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.example.essgrading.Activity.BaseActivity;
import com.example.essgrading.Adapter.AnswerAdapter;
import com.example.essgrading.R;
import java.util.ArrayList;
import java.util.List;

public class ListAnswerActivity extends BaseActivity {

    private RecyclerView recyclerViewAnswers;
    private TextView txtExCode;
    private List<int[]> answerData;
    private String selectedExCode;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_listanswer);
        setupDrawer();
        setHeaderTitle("Đáp án đúng");

        // Nhận mã đề từ Intent
        Intent intent = getIntent();
        selectedExCode = intent.getStringExtra("selectedExCode");

        // Ánh xạ View
        recyclerViewAnswers = findViewById(R.id.recyclerViewAnswers);
        txtExCode = findViewById(R.id.txtExCode);

        // Cập nhật tiêu đề mã đề
        txtExCode.setText("Mã đề " + selectedExCode);

        // Dữ liệu đáp án giả lập
        answerData = new ArrayList<>();
        answerData.add(new int[]{1, 0, 0, 0});
        answerData.add(new int[]{0, 1, 0, 0});
        answerData.add(new int[]{0, 0, 1, 0});
        answerData.add(new int[]{0, 0, 0, 1});
        answerData.add(new int[]{1, 0, 0, 0});
        answerData.add(new int[]{0, 0, 0, 1});
        answerData.add(new int[]{0, 1, 0, 0});
        answerData.add(new int[]{1, 0, 0, 0});
        answerData.add(new int[]{0, 0, 1, 0});


        // Cấu hình Adapter
        // Thiết lập Adapter
        AnswerAdapter adapter = new AnswerAdapter(answerData);
        recyclerViewAnswers.setLayoutManager(new LinearLayoutManager(this));
        recyclerViewAnswers.setAdapter(adapter);
        adapter.notifyDataSetChanged(); // Cập nhật RecyclerView

    }
}
