using System;
using System.Text.Json.Serialization;

namespace SEP490_G77_ESS.Models
{
    public partial class Bank
    {
        public long BankId { get; set; }
        public string? Bankname { get; set; }
        public byte? Bankstatus { get; set; }
        public long? Totalquestion { get; set; }

        [JsonIgnore] // ✅ Ẩn Accid khi serialize JSON
        public long? Accid { get; set; }

        public long? GradeId { get; set; }
        public long? SubjectId { get; set; }
        public long? CurriculumId { get; set; } // ✅ Giữ lại CurriculumId
        public DateTime? CreateDate { get; set; }

        // ✅ Loại bỏ các navigation properties không cần thiết
        [JsonIgnore] public virtual Account? Acc { get; set; }
        [JsonIgnore] public virtual ICollection<BankAccess> BankAccesses { get; set; } = new List<BankAccess>();
        [JsonIgnore] public virtual ICollection<BankLogger> BankLoggers { get; set; } = new List<BankLogger>();
        [JsonIgnore] public virtual Curriculum? Curriculum { get; set; }
        [JsonIgnore] public virtual Grade? Grade { get; set; }
        [JsonIgnore] public virtual ICollection<Section> Sections { get; set; } = new List<Section>();
        [JsonIgnore] public virtual Subject? Subject { get; set; }
    }
}
        