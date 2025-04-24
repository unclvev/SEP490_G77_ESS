package com.example.essgrading.Activity.Test;

import android.content.Intent;
import android.os.Bundle;
import android.widget.TextView;
import androidx.recyclerview.widget.GridLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.example.essgrading.Activity.BaseActivity;
import com.example.essgrading.Adapter.ExCodeAdapter;
import com.example.essgrading.R;

import java.util.List;

public class SelectExCodeActivity extends BaseActivity {

    private RecyclerView recyclerViewExCodes;
    private TextView txtTestTitle, txtClassCode, txtHeader;
    private List<String> exCodeList;
    private String testTitle, classCode;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_selectexcode);
        setupDrawer();
        setHeaderTitle("Bài kiểm tra");

        // Nhận dữ liệu
        Intent intent = getIntent();
        testTitle = intent.getStringExtra("testTitle");
        classCode = intent.getStringExtra("classCode");
        exCodeList = intent.getStringArrayListExtra("exCodes");

        // Ánh xạ view
        txtTestTitle = findViewById(R.id.txtTestTitle);
        txtClassCode = findViewById(R.id.txtClassCode);
        txtHeader = findViewById(R.id.txtHeader);
        recyclerViewExCodes = findViewById(R.id.recyclerViewExCodes);

        // Set thông tin
        txtTestTitle.setText(testTitle);
        txtClassCode.setText(classCode);

        // Gán danh sách mã đề
        if (exCodeList != null) {
            ExCodeAdapter adapter = new ExCodeAdapter(exCodeList, selectedExCode -> {
                Intent answerIntent = new Intent(SelectExCodeActivity.this, ListAnswerActivity.class);
                answerIntent.putExtra("testTitle", testTitle);
                answerIntent.putExtra("classCode", classCode);
                answerIntent.putExtra("selectedExCode", selectedExCode);
                startActivity(answerIntent);
            });
            recyclerViewExCodes.setLayoutManager(new GridLayoutManager(this, 2));
            recyclerViewExCodes.setAdapter(adapter);
        }
    }
}
