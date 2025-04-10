//using Microsoft.Extensions.DependencyInjection;
//using Microsoft.Extensions.Hosting;
//using SEP490_G77_ESS.Models;
//using System;
//using System.Linq;
//using System.Threading;
//using System.Threading.Tasks;

//namespace SEP490_G77_ESS.Services
//{
//    public class AccountCleanupService : BackgroundService
//    {
//        private readonly IServiceScopeFactory _scopeFactory;
//        private readonly TimeSpan _checkInterval = TimeSpan.FromMinutes(5);

//        public AccountCleanupService(IServiceScopeFactory scopeFactory)
//        {
//            _scopeFactory = scopeFactory;
//        }

//        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
//        {
//            while (!stoppingToken.IsCancellationRequested)
//            {
//                using (var scope = _scopeFactory.CreateScope())
//                {
//                    var context = scope.ServiceProvider.GetRequiredService<EssDbV11Context>();
//                    var expirationTime = DateTime.Now.AddMinutes(5);
//                    var expiredAccounts = context.Accounts
//                        .Where(u => u.IsActive == 0 && u.Datejoin < expirationTime)
//                        .ToList();

//                    if (expiredAccounts.Any())
//                    {
//                        context.Accounts.RemoveRange(expiredAccounts);
//                        await context.SaveChangesAsync(stoppingToken);
//                    }
//                }
//                await Task.Delay(_checkInterval, stoppingToken);
//            }
//        }
//    }
//}
