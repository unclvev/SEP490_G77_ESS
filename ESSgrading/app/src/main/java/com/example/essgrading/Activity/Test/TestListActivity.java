package com.example.essgrading.Activity.Test;

import android.content.Intent;
import android.os.Bundle;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.example.essgrading.Activity.BaseActivity;
import com.example.essgrading.Adapter.TestAdapter;
import com.example.essgrading.Model.TestModel;
import com.example.essgrading.R;
import com.google.android.material.floatingactionbutton.FloatingActionButton;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class TestListActivity extends BaseActivity {

    private RecyclerView recyclerViewTests;
    private FloatingActionButton fabAddTest;
    private TestAdapter testAdapter;
    private List<TestModel> testList;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_testlist);
        setupDrawer();
        setHeaderTitle("Trắc nghiệm");

        recyclerViewTests = findViewById(R.id.recyclerViewTests);
        fabAddTest = findViewById(R.id.fabAddTest);

        // Tạo danh sách bài kiểm tra với mã đề
        testList = new ArrayList<>();
        testList.add(new TestModel("Toán khối 2", "2A2", "40 câu hỏi", "05/02/2025", Arrays.asList("001", "002", "003")));
        testList.add(new TestModel("Toán khối 3", "3A3", "40 câu hỏi", "05/02/2025", Arrays.asList("001", "002", "003", "004")));

        // Khởi tạo Adapter và xử lý sự kiện click
        testAdapter = new TestAdapter(this, testList, selectedTest -> {
            // Khi nhấn vào bài kiểm tra -> chuyển sang SelectExCodeActivity
            Intent intent = new Intent(TestListActivity.this, SelectExCodeActivity.class);
            intent.putExtra("testTitle", selectedTest.getTitle());
            intent.putExtra("classCode", selectedTest.getClassCode());
            intent.putStringArrayListExtra("exCodes", new ArrayList<>(selectedTest.getExCodes())); // Truyền danh sách mã đề
            startActivity(intent);
        });

        recyclerViewTests.setLayoutManager(new LinearLayoutManager(this));
        recyclerViewTests.setAdapter(testAdapter);
    }
}
