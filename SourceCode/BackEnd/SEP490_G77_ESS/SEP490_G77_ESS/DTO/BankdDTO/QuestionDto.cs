namespace SEP490_G77_ESS.DTO.BankdDTO
{
    public class QuestionDto
    {
        public long Quesid { get; set; }
        public string Quescontent { get; set; }
        public long? Secid { get; set; }
        public long TypeId { get; set; }
        public string Solution { get; set; }
        public long Modeid { get; set; }
        public List<string> Answers { get; set; }
        public List<string> CorrectAnswers { get; set; }
    }
}
