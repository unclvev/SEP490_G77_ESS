namespace SEP490_G77_ESS.DTO.ExamDTO
{
    public class ExamRequest
    {
        public string? Examname { get; set; }
        public DateTime? Createdate { get; set; }

        
        public GenerateDataDto? GenerateData { get; set; }
    }

    
    public class GenerateDataDto
    {
        public List<TopicSelection> Topics { get; set; } = new();
    }

    public class TopicSelection
    {
        public int SectionId { get; set; } 
        public Dictionary<string, int> Levels { get; set; } = new(); // "RL": 3, "U": 2, "A": 1
    }
}
