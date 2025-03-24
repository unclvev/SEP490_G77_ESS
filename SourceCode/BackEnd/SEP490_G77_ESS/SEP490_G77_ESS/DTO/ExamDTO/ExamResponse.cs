namespace SEP490_G77_ESS.DTO.ExamDTO
{
    public class ExamResponse
    {
        public long ExamId { get; set; }
        public string ExamName { get; set; } = string.Empty;
        public List<QuestionDto> Questions { get; set; } = new();
    }

    public class QuestionDto
    {
        public long QuestionId { get; set; }
        public string Content { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public List<AnswerDto> Answers { get; set; } = new();
    }

    public class AnswerDto
    {
        public long AnswerId { get; set; }
        public string Content { get; set; } = string.Empty;
        public bool IsCorrect { get; set; }
    }
}
