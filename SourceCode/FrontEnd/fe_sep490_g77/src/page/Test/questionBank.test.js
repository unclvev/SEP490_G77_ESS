// File: src/page/Test/questionbank.test.js
const { Builder, By, until } = require('selenium-webdriver');
const edge = require('selenium-webdriver/edge');

let driver;

beforeAll(async () => {
  driver = await new Builder()
    .forBrowser('MicrosoftEdge')
    .setEdgeOptions(new edge.Options())
    .build();

  // Login once
  await driver.get('http://localhost:3000/login');
  await driver.findElement(By.css('input[placeholder="Email hoặc tên"]'))
    .sendKeys('thanhduc1234521@gmail.com');
  await driver.findElement(By.css('input[placeholder="Mật khẩu"]'))
    .sendKeys('123');
  await driver.findElement(By.xpath("//button[contains(text(),'Đăng nhập')]"))
    .click();
  await driver.wait(until.urlIs('http://localhost:3000/'), 10000);
}, 60000);

afterAll(async () => {
  if (driver) await driver.quit();
});

describe('Question Bank & Create Bank Integration Test', () => {
  const bankUrl   = 'http://localhost:3000/question-bank';
  const createUrl = 'http://localhost:3000/create-question-bank';
  const detailUrl = 'http://localhost:3000/question-bank-detail/40016';

  // ----- Question Bank Tests -----
  test('TC01 - Load Question Bank page', async () => {
    await driver.get(bankUrl);
    const header = await driver.wait(until.elementLocated(By.css('h1.text-2xl')), 10000);
    expect(await header.getText()).toBe('QUẢN LÝ NGÂN HÀNG CÂU HỎI');
  }, 60000);

  test('TC02 - Switch to "Ngân hàng hệ thống" tab', async () => {
    await driver.get(bankUrl);
    const systemTab = await driver.wait(
      until.elementLocated(By.xpath("//div[contains(@class,'ant-tabs-tab') and normalize-space(text())='Ngân hàng hệ thống']")),
      10000
    );
    await systemTab.click();
    const active = await driver.wait(until.elementLocated(By.css('.ant-tabs-tab-active')), 10000);
    expect(await active.getText()).toBe('Ngân hàng hệ thống');
  }, 60000);

  test('TC03 - Personal tab shows cards or empty message', async () => {
    await driver.get(bankUrl);
    const pane     = '.ant-tabs-tabpane-active';
    const cardSel  = `${pane} .ant-card`;
    const emptySel = `${pane}//p[normalize-space(text())="Không tìm thấy kết quả."]`;

    try {
      await driver.wait(until.elementLocated(By.css(cardSel)), 5000);
      const cards = await driver.findElements(By.css(cardSel));
      expect(cards.length).toBeGreaterThan(0);
    } catch {
      const msgEl = await driver.findElement(By.xpath(emptySel));
      expect(await msgEl.getText()).toBe('Không tìm thấy kết quả.');
    }
  }, 60000);

  test('TC04 - Default tab shows at least one card', async () => {
    await driver.get(bankUrl);
    const systemTab = await driver.findElement(
      By.xpath("//div[contains(@class,'ant-tabs-tab') and normalize-space(text())='Ngân hàng hệ thống']")
    );
    await systemTab.click();
    const cardsSel = '.ant-tabs-tabpane-active .ant-card';
    await driver.wait(until.elementLocated(By.css(cardsSel)), 10000);
    const cards = await driver.findElements(By.css(cardsSel));
    expect(cards.length).toBeGreaterThan(0);
  }, 60000);

  test('TC05 - Search “Toán” in personal tab', async () => {
    await driver.get(bankUrl);
    const searchInput = await driver.wait(
      until.elementLocated(By.css('input[placeholder="Tìm kiếm..."]')),
      10000
    );
    await searchInput.clear();
    await searchInput.sendKeys('Toán');
    await driver.sleep(500);
    const cards = await driver.findElements(By.css('.ant-tabs-tabpane-active .ant-card'));
    expect(cards.length).toBeGreaterThan(0);
  }, 60000);

  test('TC06 - Filter by Grade = Kh?i 10', async () => {
    await driver.get(bankUrl);

    // open the Khối dropdown
    const selectors = await driver.wait(
      until.elementsLocated(By.css('.ant-select-selector')),
      10000
    );
    await selectors[0].click();

    // wait for dropdown container
    const dropdown = await driver.wait(
      until.elementLocated(By.css('.ant-select-dropdown')),
      5000
    );
    // select "Kh?i 10"
    const kh10 = await dropdown.findElement(By.xpath(
      ".//div[contains(@class,'ant-select-item-option-content') and normalize-space(text())='Kh?i 10']"
    ));
    await driver.wait(until.elementIsVisible(kh10), 5000);
    await kh10.click();

    await driver.sleep(500);
    const cards = await driver.findElements(By.css('.ant-tabs-tabpane-active .ant-card'));
    expect(cards.length).toBeGreaterThan(0);
  }, 60000);

  // ----- Create Question Bank Tests -----
  test('TC07 - Load Create Question Bank page', async () => {
    await driver.get(createUrl);
    const header = await driver.wait(
      until.elementLocated(By.xpath("//h1[contains(normalize-space(.),'TẠO NGÂN HÀNG CÂU HỎI')]")),
      10000
    );
    expect(await header.getText()).toBe('TẠO NGÂN HÀNG CÂU HỎI');
  }, 60000);

  test('TC08 - Create bank with Custom curriculum', async () => {
    await driver.get(createUrl);

    // wait for all three dropdowns
    const selectors = await driver.wait(
      until.elementsLocated(By.css('.ant-select-selector')),
      10000
    );

    // Grade = Kh?i 10
    await selectors[0].click();
    const gradeDropdown = await driver.wait(until.elementLocated(By.css('.ant-select-dropdown')), 5000);
    const gradeOpt = await gradeDropdown.findElement(By.xpath(
      ".//div[contains(@class,'ant-select-item-option-content') and normalize-space(text())='Kh?i 10']"
    ));
    await driver.wait(until.elementIsVisible(gradeOpt), 5000);
    await gradeOpt.click();

    // Subject = Toán
    await selectors[1].click();
    const subjDropdown = await driver.wait(until.elementLocated(By.css('.ant-select-dropdown')), 5000);
    const subjOpt = await subjDropdown.findElement(By.xpath(
      ".//div[contains(@class,'ant-select-item-option-content') and normalize-space(text())='Toán']"
    ));
    await driver.wait(until.elementIsVisible(subjOpt), 5000);
    await subjOpt.click();

    // Curriculum = Custom
    await selectors[2].click();
    const currDropdown = await driver.wait(until.elementLocated(By.css('.ant-select-dropdown')), 5000);
    const customOpt = await currDropdown.findElement(By.xpath(
      ".//div[contains(@class,'ant-select-item-option-content') and normalize-space(text())='Custom']"
    ));
    await driver.wait(until.elementIsVisible(customOpt), 5000);
    await customOpt.click();

    // click Create
    await driver.findElement(By.xpath("//button[contains(normalize-space(.),'Tạo ngân hàng')]")).click();

    await driver.wait(until.urlMatches(/\/question-bank-detail\/\d+$/), 10000);
    expect(await driver.getCurrentUrl()).toMatch(/\/question-bank-detail\/\d+$/);
  }, 60000);

  // ----- Detail Page Tests -----
  test('TC09 - Load Question Bank Detail page', async () => {
    await driver.get(detailUrl);
    const header = await driver.wait(until.elementLocated(By.css('h1.text-2xl')), 10000);
    expect(await header.getText()).toMatch(/Ngân hàng/);
    const addBtn = await driver.findElement(
      By.xpath("//button[contains(normalize-space(.),'Thêm Section')]")
    );
    expect(await addBtn.isDisplayed()).toBe(true);
  }, 60000);

  test('TC10 - Add Main Section successfully', async () => {
    await driver.get(detailUrl);

    // click Add Section
    await driver.findElement(By.xpath("//button[contains(normalize-space(.),'Thêm Section')]")).click();

    // enter unique name
    const uniqueName = `AutoSec_${Date.now()}`;
    const input = await driver.wait(
      until.elementLocated(By.css('input[placeholder="Nhập tên section"]')),
      5000
    );
    await input.sendKeys(uniqueName);

    // click OK in modal
    await driver.findElement(By.xpath(
      "//div[contains(@class,'ant-modal-footer')]//button[contains(normalize-space(.),'OK')]"
    )).click();

    // wait for new panel header
    const panel = await driver.wait(
      until.elementLocated(By.xpath(`//span[@class="font-semibold" and normalize-space(text())="${uniqueName}"]`)),
      10000
    );
    expect(await panel.getText()).toBe(uniqueName);
  }, 60000);

});
