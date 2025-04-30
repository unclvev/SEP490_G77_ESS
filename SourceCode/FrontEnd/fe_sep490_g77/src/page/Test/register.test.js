const { Builder, By, Key, until } = require('selenium-webdriver');
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

describe('Register Function Integration Test', () => {
  test('TC01 - Register with valid information', async () => {
    const randomNum = Math.floor(Math.random() * 10000);
    await driver.get('http://localhost:3000/register');
  
    await driver.findElement(By.css('input[name="username"]')).sendKeys(`testuser${randomNum}`);
    await driver.findElement(By.css('input[name="email"]')).sendKeys(`testuser${randomNum}@example.com`);
    
    const dobInput = await driver.findElement(By.css('input[name="dob"]'));
    await dobInput.clear();
    await dobInput.sendKeys('01');
    await dobInput.sendKeys('/');
    await dobInput.sendKeys('01');
    await dobInput.sendKeys('/');
    await dobInput.sendKeys('2000');
  
    await driver.findElement(By.css('input[name="phone"]')).sendKeys('0123456789');
    await driver.findElement(By.css('input[name="password"]')).sendKeys('Test@123');
    await driver.findElement(By.css('input[name="rePassword"]')).sendKeys('Test@123');
  
    await driver.findElement(By.css('button[type="submit"]')).click();
  
    // 👉 Bổ sung: đợi Toastify success hiện lên
    await driver.wait(until.elementLocated(By.css('.Toastify__toast--success')), 10000);
  
    // 👉 Sau đó đợi URL đổi sang /login
    await driver.wait(until.urlContains('/login'), 20000);
  
    const currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).toContain('/login');
  }, 60000);
  
});