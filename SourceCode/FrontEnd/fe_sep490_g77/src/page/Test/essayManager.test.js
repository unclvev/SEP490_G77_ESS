// src/page/Test/essayManager.test.js

const { Builder, By, until, Key } = require('selenium-webdriver');
const edge = require('selenium-webdriver/edge');
const path = require('path');
const fs = require('fs');

let driver;

beforeAll(async () => {
  const options = new edge.Options();
  driver = await new Builder()
    .forBrowser('MicrosoftEdge')
    .setEdgeOptions(options)
    .build();
}, 60000);

afterAll(async () => {
  if (driver) await driver.quit();
});

describe('Essay Management Flow', () => {
  test('EM01 – Create → edit → import → create & delete flow', async () => {
    // 1) Đăng nhập
    await driver.get('http://localhost:3000/login');
    await driver.sleep(500);
    await driver.findElement(By.css('input[placeholder="Email hoặc tên"]'))
      .sendKeys('hoanglongfpthn@gmail.com');
    await driver.sleep(500);
    await driver.findElement(By.css('input[placeholder="Mật khẩu"]'))
      .sendKeys('1234');
    await driver.sleep(500);
    await driver.findElement(By.xpath("//button[contains(text(),'Đăng nhập')]"))
      .click();
    await driver.wait(until.urlIs('http://localhost:3000/'), 10000);
    await driver.sleep(500);

    // 2) Chọn tab "Tự luận"
    const essayCard = await driver.wait(
      until.elementLocated(By.xpath(
        "//h2[normalize-space()='Tự luận']/ancestor::div[contains(@class,'ant-card')]"
      )),
      10000
    );
    await driver.sleep(500);
    await essayCard.click();
    await driver.wait(until.urlContains('/essay'), 5000);
    await driver.sleep(500);

    // 3) Tạo đề đầu tiên
    await driver.findElement(By.xpath("//button[normalize-space()='Tạo đề']")).click();
    await driver.wait(until.urlContains('/essay/create'), 5000);
    await driver.sleep(500);

    // Điền form tạo đề
    await driver.findElement(By.xpath(
      "//div[contains(@class,'ant-form-item') and .//label[contains(.,'Tên đề')]]//input"
    )).sendKeys('test_trung_flow');
    await driver.sleep(500);

    // Chọn Khối
    await driver.findElement(By.xpath(
      "//div[contains(@class,'ant-form-item') and .//label[contains(.,'Khối')]]//div[contains(@class,'ant-select-selector')]"
    )).click();
    await driver.sleep(500);
    await driver.findElement(By.xpath(
      "//div[contains(@class,'ant-select-item-option-content') and normalize-space()='Grade 10']"
    )).click();
    await driver.sleep(500);

    // Chọn Môn
    await driver.findElement(By.xpath(
      "//div[contains(@class,'ant-form-item') and .//label[contains(.,'Môn học')]]//div[contains(@class,'ant-select-selector')]"
    )).click();
    await driver.sleep(500);
    await driver.findElement(By.xpath(
      "//div[contains(@class,'ant-select-item-option-content') and normalize-space()='Mathematics']"
    )).click();
    await driver.sleep(500);

    // Nhập Lớp
    await driver.findElement(By.xpath(
      "//div[contains(@class,'ant-form-item') and .//label[contains(.,'Lớp')]]//input"
    )).sendKeys('11A2');
    await driver.sleep(500);

    // Gửi form
    await driver.findElement(By.xpath("//button[normalize-space()='Tạo đề']")).click();
    await driver.sleep(500);

    // 4) Sửa đề vừa tạo
    const createdCard = await driver.wait(
      until.elementLocated(By.xpath(
        "//div[contains(@class,'ant-card') and .//span[text()='test_trung_flow']]"
      )),
      7000
    );
    await driver.sleep(500);
    await createdCard.findElement(By.xpath(".//button[normalize-space()='Sửa']")).click();
    await driver.wait(until.elementLocated(By.css('.ant-modal')), 5000);
    await driver.sleep(500);

    // 5) Thao tác trong modal edit
    const modal = await driver.findElement(By.css('.ant-modal'));
    await driver.sleep(500);
    const editTitleInput = await modal.findElement(
      By.css('input[placeholder="VD: Đề kiểm tra 15p Toán"]')
    );
    await editTitleInput.sendKeys(Key.chord(Key.CONTROL, 'a'), Key.DELETE);
    await driver.sleep(200);
    await editTitleInput.sendKeys('test_trung_flow_edited');
    await driver.sleep(500);
    const editClassInput = await modal.findElement(
      By.css('input[placeholder="VD: 11A2"]')
    );
    await editClassInput.sendKeys(Key.chord(Key.CONTROL, 'a'), Key.DELETE);
    await driver.sleep(200);
    await editClassInput.sendKeys('12B1');
    await driver.sleep(500);
    await modal.findElement(By.xpath("//button[normalize-space()='Lưu']")).click();
    await driver.wait(until.elementIsNotVisible(modal), 7000);
    await driver.sleep(500);

    // 6) Đẩy danh sách học sinh & import
    const editedCard = await driver.wait(
      until.elementLocated(By.xpath(
        "//div[contains(@class,'ant-card') and .//span[text()='test_trung_flow_edited']]"
      )),
      7000
    );
    await driver.executeScript("arguments[0].scrollIntoView(true);", editedCard);
    await driver.sleep(300);
    await editedCard.findElement(By.xpath(".//button[contains(normalize-space(),'Đẩy danh sách học sinh')]")).click();
    await driver.wait(until.urlContains('/essay/import/'), 5000);
    await driver.wait(until.elementLocated(By.css("input[type='file']")), 5000);
    await driver.sleep(500);

    // Import Excel
    const fileInput = await driver.findElement(By.css("input[type='file']"));
    const filePath = path.resolve(__dirname, '../../fixtures/DanhSachSinhVien10A4.xlsx');
    if (!fs.existsSync(filePath)) throw new Error('Không tìm thấy file ' + filePath);
    await fileInput.sendKeys(filePath);
    await driver.sleep(500);
    const saveBtn = await driver.wait(
      until.elementIsEnabled(driver.findElement(
        By.xpath("//button[normalize-space()='Lưu danh sách']")
      )),
      5000
    );
    await saveBtn.click();
    await driver.wait(until.elementLocated(By.xpath("//*[contains(text(),'thành công')]")), 5000);
    await driver.sleep(500);

    // 7) Quay lại /essay
    await driver.get('http://localhost:3000/essay');
    await driver.sleep(500);

    // 8) Tạo đề thứ hai (không import)
    await driver.findElement(By.xpath("//button[normalize-space()='Tạo đề']")).click();
    await driver.wait(until.urlContains('/essay/create'), 5000);
    await driver.sleep(500);
    await driver.findElement(By.xpath(
      "//div[contains(@class,'ant-form-item') and .//label[contains(.,'Tên đề')]]//input"
    )).sendKeys('test_trung_flow2');
    await driver.sleep(500);
    await driver.findElement(By.xpath(
      "//div[contains(@class,'ant-form-item') and .//label[contains(.,'Khối')]]//div[contains(@class,'ant-select-selector')]"
    )).click();
    await driver.sleep(500);
    await driver.findElement(By.xpath(
      "//div[contains(@class,'ant-select-item-option-content') and normalize-space()='Grade 10']"
    )).click();
    await driver.sleep(500);
    await driver.findElement(By.xpath(
      "//div[contains(@class,'ant-form-item') and .//label[contains(.,'Môn học')]]//div[contains(@class,'ant-select-selector')]"
    )).click();
    await driver.sleep(500);
    await driver.findElement(By.xpath(
      "//div[contains(@class,'ant-select-item-option-content') and normalize-space()='Mathematics']"
    )).click();
    await driver.sleep(500);
    await driver.findElement(By.xpath(
      "//div[contains(@class,'ant-form-item') and .//label[contains(.,'Lớp')]]//input"
    )).sendKeys('11B3');
    await driver.sleep(500);
    await driver.findElement(By.xpath("//button[normalize-space()='Tạo đề']")).click();
    await driver.sleep(500);

    // 9) Xóa đề thứ hai
    const newCard = await driver.wait(
        until.elementLocated(By.xpath(
          "//div[contains(@class,'ant-card') and .//span[text()='test_trung_flow2']]"
        )),
        7000
      );
      await driver.executeScript("arguments[0].scrollIntoView(true);", newCard);
      await driver.sleep(300);
  
      // Mở Popconfirm
      const deleteBtn = await newCard.findElement(
        By.xpath(".//button[contains(normalize-space(),'Xoá')]")
      );
      await driver.executeScript("arguments[0].click();", deleteBtn);
      await driver.sleep(300);
  
      // Chờ Popconfirm container (ant-popover-placement-top)
      const pop = await driver.wait(
        until.elementLocated(By.css(".ant-popover-placement-top, .ant-popover-placement-bottom")),
        5000
      );
      await driver.sleep(200);
  
      // Tìm confirm button bên trong popover qua text
      const confirmBtn = await pop.findElement(
        By.xpath(".//button[normalize-space()='Xoá']")
      );
      // Scroll vào view và click bằng JS
      await driver.executeScript("arguments[0].scrollIntoView(true);", confirmBtn);
      await driver.executeScript("arguments[0].click();", confirmBtn);
  
      // Đợi thẻ biến mất
      await driver.wait(until.stalenessOf(newCard), 7000);
  }, 240000);
});
