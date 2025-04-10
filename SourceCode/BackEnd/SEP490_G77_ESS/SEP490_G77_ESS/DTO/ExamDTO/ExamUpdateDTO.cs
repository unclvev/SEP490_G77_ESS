namespace SEP490_G77_ESS.DTO.ExamDTO
{
    public class ExamUpdateDTO
    {
        public ExamInfoDTO Exam { get; set; }
        public ExamDataDetailDTO Examdata { get; set; }
    }

    public class ExamInfoDTO
    {
        public string ExamName { get; set; }
        public string Grade { get; set; }
        public string Subject { get; set; }
    }

    public class ExamDataDetailDTO
    {
        public List<QuestionDTO> Questions { get; set; } = new List<QuestionDTO>();
    }

    public class QuestionUDTO
    {
        public long QuestionId { get; set; }
        public string Content { get; set; }
        public string Type { get; set; }
        public List<AnswerDTO> Answers { get; set; } = new List<AnswerDTO>();
    }

    public class AnswerUDTO
    {
        public long AnswerId { get; set; }
        public string Content { get; set; }
        public bool IsCorrect { get; set; }
    }
}
