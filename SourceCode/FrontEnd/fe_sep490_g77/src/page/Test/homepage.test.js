const { Builder, By, until } = require('selenium-webdriver');
const edge = require('selenium-webdriver/edge'); // 💥 Import Edge driver thay vì Chrome

let driver;

beforeAll(async () => {
  const options = new edge.Options();
  driver = await new Builder()
    .forBrowser('MicrosoftEdge') // 💥 Dùng MicrosoftEdge
    .setEdgeOptions(options)
    .build();
}, 60000); // timeout 60 giây

afterAll(async () => {
  if (driver) {
    await driver.quit();
  }
});

describe('Home Page Feature Integration Test', () => {
  test('TC01 - Verify feature cards display correctly', async () => {
    await driver.get('http://localhost:3000/');

    await driver.wait(until.elementsLocated(By.css('div.ant-card')), 10000);

    const cards = await driver.findElements(By.css('div.ant-card'));
    expect(cards.length).toBe(4);

    const cardTitles = await Promise.all(cards.map(async (card) => {
      return await card.findElement(By.css('h2')).getText();
    }));

    expect(cardTitles).toEqual(expect.arrayContaining([
      'Đề thi',
      'Ngân hàng câu hỏi',
      'Chấm điểm',
      'Tự luận'
    ]));
  }, 30000);

  test('TC02 - Verify navigation to Exam page from "Đề thi" card', async () => {
    await driver.get('http://localhost:3000/');

    const examCard = await driver.findElement(By.xpath("//h2[text()='Đề thi']/ancestor::div[contains(@class, 'ant-card')]"));
    await examCard.click();

    await driver.wait(until.urlContains('/exam'), 10000);
    const currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).toContain('/exam');
  }, 30000);

  test('TC03 - Verify navigation to Question Bank page from "Ngân hàng câu hỏi" card', async () => {
    await driver.get('http://localhost:3000/');

    const questionBankCard = await driver.findElement(By.xpath("//h2[text()='Ngân hàng câu hỏi']/ancestor::div[contains(@class, 'ant-card')]"));
    await questionBankCard.click();

    await driver.wait(until.urlContains('/question-bank'), 10000);
    const currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).toContain('/question-bank');
  }, 30000);

  test('TC04 - Verify navigation to Grading page from "Chấm điểm" card', async () => {
    await driver.get('http://localhost:3000/');

    const gradingCard = await driver.findElement(By.xpath("//h2[text()='Chấm điểm']/ancestor::div[contains(@class, 'ant-card')]"));
    await gradingCard.click();

    await driver.wait(until.urlContains('/grading'), 10000);
    const currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).toContain('/grading');
  }, 30000);

  test('TC05 - Verify navigation to Essay page from "Tự luận" card', async () => {
    await driver.get('http://localhost:3000/');

    const essayCard = await driver.findElement(By.xpath("//h2[text()='Tự luận']/ancestor::div[contains(@class, 'ant-card')]"));
    await essayCard.click();

    await driver.wait(until.urlContains('/essay'), 10000);
    const currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).toContain('/essay');
  }, 30000);
});
