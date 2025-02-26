using System;
using System.Collections.Generic;

namespace SEP490_G77_ESS.Models;

public partial class CorrectAnswer
{
    public long AnsId { get; set; }

    public string? Content { get; set; }

    public long? Quesid { get; set; }

    public virtual Question? Ques { get; set; }
}
