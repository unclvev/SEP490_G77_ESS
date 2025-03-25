namespace SEP490_G77_ESS.DTO.ExamDTO
{
    public class ExamDataDTO
    {
        public long ExamId { get; set; }
        public string ExamName { get; set; }
        public List<QuestionDTO> Questions { get; set; } = new List<QuestionDTO>();
    }

    public class QuestionDTO
    {
        public long QuestionId { get; set; }
        public string Content { get; set; }
        public string Type { get; set; }
        public List<AnswerDTO> Answers { get; set; } = new List<AnswerDTO>();
    }

    public class AnswerDTO
    {
        public long AnswerId { get; set; }
        public string Content { get; set; }
        public bool IsCorrect { get; set; }
    }
}
