package com.example.essgrading.Activity.Test;

import android.content.Intent;
import android.os.Bundle;
import android.widget.TextView;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.GridLayoutManager;
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

        // Nhận mã đề từ Intent
        Intent intent = getIntent();
        selectedExCode = intent.getStringExtra("selectedExCode");

        // Ánh xạ View
        recyclerViewAnswers = findViewById(R.id.recyclerViewAnswers);
        txtExCode = findViewById(R.id.txtExCode);

        // Cập nhật tiêu đề mã đề
        txtExCode.setText("Mã đề " + selectedExCode);

        // Dữ liệu đáp án giả lập (Mỗi hàng chứa một mảng với giá trị từ 0-3 đại diện cho A, B, C, D)
        answerData = new ArrayList<>();
        answerData.add(new int[]{0, -1, -1, -1}); // Câu 0: A
        answerData.add(new int[]{-1, 1, -1, -1}); // Câu 1: B
        answerData.add(new int[]{-1, -1, 2, -1}); // Câu 2: C
        answerData.add(new int[]{-1, -1, -1, 3}); // Câu 3: D
        answerData.add(new int[]{0, -1, -1, -1}); // Câu 4: A
        answerData.add(new int[]{-1, -1, -1, 3}); // Câu 5: D
        answerData.add(new int[]{-1, 1, -1, -1}); // Câu 6: B
        answerData.add(new int[]{0, -1, -1, -1}); // Câu 7: A
        answerData.add(new int[]{-1, -1, 2, -1}); // Câu 8: C
        answerData.add(new int[]{-1, -1, -1, 3}); // Câu 9: D

        // Thiết lập Adapter
        AnswerAdapter adapter = new AnswerAdapter(answerData);
        recyclerViewAnswers.setLayoutManager(new GridLayoutManager(this, 4)); // 4 cột cho A, B, C, D
        recyclerViewAnswers.setAdapter(adapter);
    }
}
