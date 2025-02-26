package com.example.essgrading.Activity.Test;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;
import androidx.recyclerview.widget.GridLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.example.essgrading.Activity.BaseActivity;
import com.example.essgrading.Adapter.ExCodeAdapter;
import com.example.essgrading.R;

import java.util.List;

public class SelectExCodeActivity extends BaseActivity {

    private RecyclerView recyclerViewExCodes;
    private Button btnHeader;
    private List<String> exCodeList;
    private String testTitle, classCode;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_selectexcode);
        setupDrawer();
        setHeaderTitle("Bài kiểm tra");

        // Nhận dữ liệu từ TestListActivity
        Intent intent = getIntent();
        testTitle = intent.getStringExtra("testTitle");
        classCode = intent.getStringExtra("classCode");
        exCodeList = intent.getStringArrayListExtra("exCodes");

        // Ánh xạ View
        recyclerViewExCodes = findViewById(R.id.recyclerViewExCodes);
        btnHeader = findViewById(R.id.btnHeader);

        // Đặt tiêu đề mã đề
        btnHeader.setText("Mã đề");

        // Hiển thị danh sách mã đề
        if (exCodeList != null) {
            ExCodeAdapter adapter = new ExCodeAdapter(exCodeList, selectedExCode -> {
                // Khi chọn mã đề -> chuyển sang TestOptionActivity
                Intent optionIntent = new Intent(SelectExCodeActivity.this, TestOptionActivity.class);
                optionIntent.putExtra("testTitle", testTitle);
                optionIntent.putExtra("classCode", classCode);
                optionIntent.putExtra("selectedExCode", selectedExCode);
                startActivity(optionIntent);
            });
            recyclerViewExCodes.setLayoutManager(new GridLayoutManager(this, 2)); // Hiển thị 2 cột
            recyclerViewExCodes.setAdapter(adapter);
        }
    }
}
