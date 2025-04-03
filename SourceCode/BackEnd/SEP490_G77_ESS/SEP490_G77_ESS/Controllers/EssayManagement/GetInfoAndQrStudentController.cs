//using Microsoft.AspNetCore.Http;
//using Microsoft.AspNetCore.Mvc;
//using SEP490_G77_ESS.Models;

//namespace SEP490_G77_ESS.Controllers.EssayManagement
//{
//    [Route("api/[controller]")]
//    [ApiController]
//    public class GetInfoAndQrStudentController : ControllerBase
//    {
//        private readonly IComputerVisionClient _visionClient;
//        private readonly ILogger<StudentResultsController> _logger;

//        public StudentResultsController(
//            IComputerVisionClient visionClient,
//            ILogger<StudentResultsController> logger)
//        {
//            _visionClient = visionClient;
//            _logger = logger;
//        }

//        [HttpPost("extract")]
//        public async Task<ActionResult<StudentResult>> ExtractStudentResult([FromForm] IFormFile imageFile, [FromQuery] long examId)
//        {
//            if (imageFile == null || imageFile.Length == 0)
//            {
//                return BadRequest("No image file provided");
//            }

//            try
//            {
//                // Save the uploaded image temporarily
//                var tempFilePath = Path.GetTempFileName();
//                using (var stream = new FileStream(tempFilePath, FileMode.Create))
//                {
//                    await imageFile.CopyToAsync(stream);
//                }

//                // Extract text and QR codes
//                string extractedText = await ExtractTextFromImage(tempFilePath);
//                string[] qrCodes = await ExtractQrCodes(tempFilePath);

//                // Parse the extracted text into a StudentResult object
//                var studentResult = ParseStudentResult(extractedText, qrCodes, examId);

//                // Clean up temporary file
//                if (System.IO.File.Exists(tempFilePath))
//                {
//                    System.IO.File.Delete(tempFilePath);
//                }

//                return Ok(studentResult);
//            }
//            catch (Exception ex)
//            {
//                _logger.LogError(ex, "Error processing student result image");
//                return StatusCode(500, $"Internal server error: {ex.Message}");
//            }
//        }
//    }
//}
