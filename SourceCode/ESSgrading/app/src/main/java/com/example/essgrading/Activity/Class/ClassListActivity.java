package com.example.essgrading.Activity.Class;

import android.os.Bundle;
import android.view.View;
import android.widget.Toast;

import androidx.drawerlayout.widget.DrawerLayout;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.example.essgrading.Activity.BaseActivity;
import com.example.essgrading.Adapter.ClassAdapter;
import com.example.essgrading.Model.ClassModel;
import com.example.essgrading.R;
import com.google.android.material.floatingactionbutton.FloatingActionButton;
import com.google.android.material.navigation.NavigationView;
import java.util.ArrayList;
import java.util.List;

public class ClassListActivity extends BaseActivity {

    private RecyclerView recyclerViewClasses;
    private FloatingActionButton fabAddClass;
    private DrawerLayout drawerLayout;
    private NavigationView navigationView;
    private ClassAdapter classAdapter;
    private List<ClassModel> classList;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_classlist);
        setupDrawer();
        setHeaderTitle("Lớp học");

        recyclerViewClasses = findViewById(R.id.recyclerViewClasses);
        fabAddClass = findViewById(R.id.fabAddClass);

        // Dữ liệu lớp học giả lập
        classList = new ArrayList<>();
        classList.add(new ClassModel("2A2", "40", "05/02/2025"));
        classList.add(new ClassModel("3A3", "40", "05/02/2025"));

        classAdapter = new ClassAdapter(classList);
        recyclerViewClasses.setLayoutManager(new LinearLayoutManager(this));
        recyclerViewClasses.setAdapter(classAdapter);

        // Sự kiện click nút +
        fabAddClass.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Toast.makeText(ClassListActivity.this, "Thêm lớp học", Toast.LENGTH_SHORT).show();
            }
        });
    }
}
