namespace SEP490_G77_ESS.DTO.BankdDTO
{
    public class BankDto
    {
        public long BankId { get; set; }
        public string BankName { get; set; }
        public long? CurriculumId { get; set; }
        public string Grade { get; set; }
        public string Subject { get; set; }
        public List<SectionDto> Sections { get; set; } = new List<SectionDto>();
    }

    public class SectionDto
    {
        public long Secid { get; set; }
        public string Secname { get; set; }
        public List<SectionDto> Children { get; set; } = new List<SectionDto>();

    }

}
