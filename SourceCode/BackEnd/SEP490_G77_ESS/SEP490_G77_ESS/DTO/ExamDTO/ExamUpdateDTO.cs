namespace SEP490_G77_ESS.DTO.ExamDTO
{
    public class ExamUpdateDTO
    {
        public ExamMetaData Exam { get; set; }
        public List<ExamCodeGroup> ExamCodes { get; set; }
    }

    public class ExamMetaData
    {
        public string ExamName { get; set; }
        public string Grade { get; set; }
        public string Subject { get; set; }
    }

    public class ExamCodeGroup
    {
        public string ExamCode { get; set; }
        public List<QuestionUDto> Questions { get; set; }
    }

    public class QuestionUDto
    {
        public long QuestionId { get; set; }
        public string Content { get; set; }
        public string Type { get; set; }
        public string ImageUrl { get; set; }
        public List<AnswerUDto> Answers { get; set; }
    }

    public class AnswerUDto
    {
        public int AnswerId { get; set; }
        public string Content { get; set; }
        public bool IsCorrect { get; set; }
    }
}
