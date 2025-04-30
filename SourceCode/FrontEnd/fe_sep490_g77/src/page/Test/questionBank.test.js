// tests/page/Test/questionBank.test.js

const { Builder, By, Key, until } = require('selenium-webdriver');
const edge = require('selenium-webdriver/edge');

let driver;

beforeAll(async () => {
  const options = new edge.Options();
  driver = await new Builder()
    .forBrowser('MicrosoftEdge')
    .setEdgeOptions(options)
    .build();

  await driver.get('http://localhost:3000/login');

  const emailInput = await driver.findElement(By.css('input[placeholder="Email hoặc tên"]'));
  await emailInput.sendKeys('thanhduc1234521@gmail.com');

  const passwordInput = await driver.findElement(By.css('input[placeholder="Mật khẩu"]'));
  await passwordInput.sendKeys('123');

  const loginButton = await driver.findElement(By.xpath("//button[contains(.,'Đăng nhập')]") );
  await loginButton.click();

  await driver.wait(until.urlContains('/'), 10000);


  // Set accid + persist:root
await driver.executeScript(`
  localStorage.setItem('accid', '20009');
  // phải đóng gói state.persist:root như Redux lưu
  const state = {
    token: JSON.stringify({ token: '1a48e1d3-3059-4449-a9bd-963f4eddd6ea' })
  };
  localStorage.setItem('persist:root', JSON.stringify(state));
`);


  await driver.get('http://localhost:3000/question-bank');
  await driver.wait(until.elementLocated(By.css('div.ant-card')), 10000);
}, 60000);

afterAll(async () => {
  if (driver) {
    await driver.quit();
  }
});

describe('Question Bank - View Banks', () => {

  test('TC01 - View List of Banks after Login', async () => {
    const userBankSection = await driver.findElement(
      By.xpath("//h2[contains(.,'Ngân hàng đề của bạn')]/following-sibling::div")
    );
    const cards = await userBankSection.findElements(By.css('.ant-card'));
    expect(cards.length).toBeGreaterThan(0);
  }, 30000);

  test('TC02 - Search ngân hàng theo từ khóa "Toán"', async () => {
    const searchInput = await driver.findElement(
      By.css('input[placeholder="Nhập tên ngân hàng câu hỏi..."]')
    );
    await searchInput.clear();
    await searchInput.sendKeys('Toán', Key.RETURN);
    await driver.sleep(2000);

    const bankCards = await driver.findElements(By.css('div.ant-card'));
    expect(bankCards.length).toBeGreaterThan(0);

    for (let card of bankCards) {
      const text = await card.getText();
      expect(text).toMatch(/Toán/i);
    }
  }, 30000);

  test('TC03 - Filter only by Subject "Toán"', async () => {
    // Mở dropdown "Môn học"
    const subjectDropdown = await driver.findElement(By.xpath("//span[contains(text(),'Môn học')]/ancestor::div[contains(@class,'ant-select')]"));
    await subjectDropdown.click();
    await driver.sleep(500);
  
    // Chọn "Toán"
    const subjectOption = await driver.findElement(By.xpath("//div[contains(@class,'ant-select-item-option-content') and text()='Toán']"));
    await subjectOption.click();
    await driver.sleep(500);
  
    // Bấm nút "Tìm kiếm" bằng tìm button đúng text
    const allButtons = await driver.findElements(By.css('button.ant-btn'));
    for (let btn of allButtons) {
      const text = await btn.getText();
      if (text.includes('Tìm kiếm')) {
        await btn.click();
        break;
      }
    }
    await driver.sleep(2000);
  
    // Kiểm tra kết quả
    const bankCards = await driver.findElements(By.css('div.ant-card'));
    expect(bankCards.length).toBeGreaterThan(0);
  
    for (let card of bankCards) {
      const text = await card.getText();
      expect(text).toMatch(/Toán/i);
    }
  
    console.log('✅ TC03 - Filter by Subject "Toán" thành công');
  }, 30000);
  

  test('TC04 - Click "Tạo ngân hàng đề thi" button', async () => {
    const createButton = await driver.findElement(
      By.xpath("//button[contains(.,'Tạo ngân hàng đề thi')]")
    );
    await createButton.click();
    await driver.wait(until.urlContains('/create-question-bank'), 10000);

    const currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).toContain('/create-question-bank');
  }, 30000);

  test('TC05 - Edit bank name successfully', async () => {
    await driver.get('http://localhost:3000/question-bank');
    await driver.wait(until.elementLocated(By.css('div.ant-card')), 10000);

    const editBtn = await driver.findElement(By.css('div.ant-card .bg-green-500'));
    await editBtn.click();

    // capture the modal container
    const modal = await driver.wait(
      until.elementLocated(By.xpath("//div[contains(@class,'ant-modal') and .//div[contains(text(),'Đổi tên ngân hàng')]]")),
      10000
    );

    const nameInput = await modal.findElement(By.css('input.ant-input'));
    await nameInput.click();
    await nameInput.clear();
    await nameInput.sendKeys('Ngân hàng Toán 10 nâng cao');

    const confirm = await modal.findElement(By.xpath(".//button[contains(.,'Cập nhật')]") );
    await confirm.click();

    // wait for success toast
    const toast = await driver.wait(
      until.elementLocated(By.xpath("//div[contains(@class,'Toastify__toast-body') and contains(.,'Cập nhật tên ngân hàng thành công!')]") ),
      10000
    );
    expect(await toast.getText()).toContain('Cập nhật tên ngân hàng thành công!');
  }, 30000);


    test('TC06 - Delete a bank successfully', async () => {
    await driver.get('http://localhost:3000/question-bank');
    await driver.wait(until.elementLocated(By.css('div.ant-card')), 10000);

    const initialCards = await driver.findElements(By.css('div.ant-card'));
    const initialCount = initialCards.length;

    const deleteButton = await driver.findElement(By.css('div.ant-card .bg-red-500'));
    await deleteButton.click();

    const modal = await driver.wait(until.elementLocated(
      By.xpath("//div[contains(@class,'ant-modal') and .//div[contains(text(),'Xác nhận xóa')]]")
    ), 10000);
    const confirmDeleteButton = await modal.findElement(
      By.xpath(".//button[contains(.,'Xóa')]")
    );
    await driver.executeScript("arguments[0].click();", confirmDeleteButton);

    // chờ toast thành công
    const successToast = await driver.wait(until.elementLocated(By.css('.Toastify__toast-body')), 5000);
    const toastText = await successToast.getText();
    expect(toastText).toMatch(/✅ Xóa ngân hàng câu hỏi thành công!/);

    // chờ số card giảm đi 1
    await driver.wait(async () => {
      const afterCards = await driver.findElements(By.css('div.ant-card'));
      return afterCards.length === initialCount - 1;
    }, 10000);
  }, 30000);
});
