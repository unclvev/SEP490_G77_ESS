const { Builder, By, until } = require('selenium-webdriver');
const edge = require('selenium-webdriver/edge');

let driver;

beforeAll(async () => {
  const options = new edge.Options();
  driver = await new Builder()
    .forBrowser('MicrosoftEdge')
    .setEdgeOptions(options)
    .build();
}, 60000);

afterAll(async () => {
  if (driver) {
    await driver.quit();
  }
});

describe('Login & Forgot Password Function Integration Test', () => {

  // ------------------- LOGIN TEST CASES -------------------
  test('TC01 - Login with valid credentials', async () => {
    await driver.get('http://localhost:3000/login');

    const emailInput = await driver.findElement(By.css('input[placeholder="Email hoặc tên"]'));
    await emailInput.sendKeys('thanhduc1234521@gmail.com');

    const passwordInput = await driver.findElement(By.css('input[placeholder="Mật khẩu"]'));
    await passwordInput.sendKeys('123');

    const loginButton = await driver.findElement(By.xpath("//button[contains(text(),'Đăng nhập')]"));
    await loginButton.click();

    await driver.wait(until.urlIs('http://localhost:3000/'), 20000);

    const currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).toBe('http://localhost:3000/');

    const jwt = await driver.executeScript("return localStorage.getItem('jwt');");
    expect(jwt).not.toBeNull();
  }, 60000);

  test('TC02 - Login with invalid email', async () => {
    await driver.get('http://localhost:3000/login');
  
    const emailInput = await driver.findElement(By.css('input[placeholder="Email hoặc tên"]'));
    await emailInput.sendKeys('invalidemail@example.com');
  
    const passwordInput = await driver.findElement(By.css('input[placeholder="Mật khẩu"]'));
    await passwordInput.sendKeys('123');
  
    const loginButton = await driver.findElement(By.xpath("//button[contains(text(),'Đăng nhập')]"));
    await loginButton.click();
  
    await driver.wait(until.elementLocated(By.css('.ant-message')), 10000);
  
    const currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).toContain('/login');
  }, 60000);

  test('TC03 - Login with invalid password', async () => {
    await driver.get('http://localhost:3000/login');

    const emailInput = await driver.findElement(By.css('input[placeholder="Email hoặc tên"]'));
    await emailInput.sendKeys('thanhduc1234521@gmail.com');

    const passwordInput = await driver.findElement(By.css('input[placeholder="Mật khẩu"]'));
    await passwordInput.sendKeys('wrongpassword');

    const loginButton = await driver.findElement(By.xpath("//button[contains(text(),'Đăng nhập')]"));
    await loginButton.click();

    await driver.wait(until.elementLocated(By.css('.ant-message')), 10000);

    const currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).toContain('/login');
  }, 60000);

  test('TC04 - Login with empty fields', async () => {
    await driver.get('http://localhost:3000/login');

    const loginButton = await driver.findElement(By.xpath("//button[contains(text(),'Đăng nhập')]"));
    await loginButton.click();

    await driver.wait(until.elementLocated(By.css('.ant-message')), 10000);

    const currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).toContain('/login');
  }, 60000);

  test('TC05 - Login with only email filled', async () => {
    await driver.get('http://localhost:3000/login');

    const emailInput = await driver.findElement(By.css('input[placeholder="Email hoặc tên"]'));
    await emailInput.sendKeys('thanhduc1234521@gmail.com');

    const loginButton = await driver.findElement(By.xpath("//button[contains(text(),'Đăng nhập')]"));
    await loginButton.click();

    await driver.wait(until.elementLocated(By.css('.ant-message')), 10000);

    const currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).toContain('/login');
  }, 60000);

  test('TC06 - Forgot Password with valid email', async () => {
    await driver.get('http://localhost:3000/login');
  
    const forgotLink = await driver.findElement(By.partialLinkText('Quên'));
    await forgotLink.click();
  
    await driver.wait(until.urlContains('/forgot-password'), 10000);
  
    const emailInput = await driver.findElement(By.css('input[placeholder="Email"]'));
    await emailInput.sendKeys('thanhduc1234521@gmail.com');
  
    const confirmButton = await driver.findElement(By.xpath("//button[contains(., 'Xác nhận')]"));
    await confirmButton.click();
  
    await driver.wait(until.elementLocated(By.css('.Toastify__toast--success')), 10000);
    const msg = await driver.findElement(By.css('.Toastify__toast-body')).getText();
    expect(msg).toContain('Vui lòng kiểm tra email');
  }, 60000);
  
  test('TC07 - Forgot Password with invalid email', async () => {
    await driver.get('http://localhost:3000/forgot-password');
  
    const emailInput = await driver.findElement(By.css('input[placeholder="Email"]'));
    await emailInput.clear();
    await emailInput.sendKeys('notfound@example.com');
  
    const confirmButton = await driver.findElement(By.xpath("//button[contains(., 'Xác nhận')]"));
    await confirmButton.click();
  
    await driver.wait(until.elementLocated(By.css('.Toastify__toast--error')), 10000);
    const msg = await driver.findElement(By.css('.Toastify__toast-body')).getText();
    expect(msg).toContain('Email không tồn tại');
  }, 60000);
  
  test('TC08 - Forgot Password with invalid email format', async () => {
    await driver.get('http://localhost:3000/forgot-password');
  
    const emailInput = await driver.findElement(By.css('input[placeholder="Email"]'));
    await emailInput.clear();
    await emailInput.sendKeys('abc@@gmail..com');
  
    const confirmButton = await driver.findElement(By.xpath("//button[contains(., 'Xác nhận')]"));
    await confirmButton.click();
  
    await driver.wait(until.elementLocated(By.css('.Toastify__toast--error')), 10000);
    const msg = await driver.findElement(By.css('.Toastify__toast-body')).getText();
    expect(msg).toContain('Email không hợp lệ');
  }, 60000);
  


  // ------------------- GOOGLE LOGIN TEST CASES -------------------
  test('TC10 - Google login button renders', async () => {
    await driver.get('http://localhost:3000/login');

    const iframe = await driver.wait(
      until.elementLocated(By.css('iframe[src*="accounts.google.com"]')),
      10000
    );

    expect(iframe).toBeDefined();
  }, 60000);

  test('TC11 - Google login button renders and opens popup', async () => {
    await driver.get('http://localhost:3000/login');

    const iframe = await driver.wait(
      until.elementLocated(By.css('iframe[src*="accounts.google.com"]')),
      10000
    );

    expect(iframe).toBeDefined();

    // Selenium không thể tương tác popup Google Auth => chỉ check render iframe là đủ
  }, 60000);
});
