package com.example.essgrading.Activity.Class;

import android.content.Intent;
import android.os.Bundle;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.drawerlayout.widget.DrawerLayout;
import androidx.viewpager2.widget.ViewPager2;

import com.example.essgrading.Activity.BaseActivity;
import com.example.essgrading.Adapter.ClassDetailPagerAdapter;
import com.example.essgrading.R;
import com.google.android.material.tabs.TabLayout;
import com.google.android.material.tabs.TabLayoutMediator;

public class ClassDetailActivity extends BaseActivity {

    private String classCode;
    private TabLayout tabLayout;
    private DrawerLayout drawerLayout;
    private ViewPager2 viewPager;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_classdetail);
        setupDrawer();
        setHeaderTitle("Lớp học");

        // Nhận dữ liệu từ ClassListActivity
        Intent intent = getIntent();
        classCode = intent.getStringExtra("classCode");

        // Ánh xạ View
        tabLayout = findViewById(R.id.tabLayout);
        viewPager = findViewById(R.id.viewPager);

        // Thiết lập Adapter cho ViewPager
        ClassDetailPagerAdapter adapter = new ClassDetailPagerAdapter(this, classCode);
        viewPager.setAdapter(adapter);

        // Kết nối TabLayout với ViewPager
        new TabLayoutMediator(tabLayout, viewPager, new TabLayoutMediator.TabConfigurationStrategy() {
            @Override
            public void onConfigureTab(@NonNull TabLayout.Tab tab, int position) {
                if (position == 0) {
                    tab.setText("Bài kiểm tra");
                } else {
                    tab.setText("Học sinh");
                }
            }
        }).attach();
    }
}
