using System;
using System.Collections.Generic;

namespace SEP490_G77_ESS.Models;

public partial class Question
{
    public long Quesid { get; set; }

    public string? Quescontent { get; set; }

    public long TypeId { get; set; }

    public string? Solution { get; set; }

    public long? Secid { get; set; }

    public long? Modeid { get; set; }

    public string? AnswerContent { get; set; }

    public virtual ICollection<CorrectAnswer> CorrectAnswers { get; set; } = new List<CorrectAnswer>();

    public virtual Level? Mode { get; set; }

    public virtual Section? Sec { get; set; }

    public long? DfSectionId { get; set; }

    public virtual DefaultSectionHierarchy? DefaultSection { get; set; }


    public virtual TypeQuestion Type { get; set; } = null!;

    public string? ImageUrl { get; set; } // ✅ Thêm dòng này
}
