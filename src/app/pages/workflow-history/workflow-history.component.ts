import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { HttpService } from '../../service/http-service';
import { NzMessageService } from 'ng-zorro-antd/message';

interface WorkflowStat {
    label: string;
    count: number;
    color: string;
    icon?: string;
}


@Component({
    selector: 'app-workflow-history',
    templateUrl: './workflow-history.component.html',
    styleUrl: './workflow-history.component.scss',
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    imports: [CommonModule,
        NzTimelineModule,
        NzCardModule,
        NzButtonModule,
        NzCollapseModule,
        NzTagModule,
        NzEmptyModule

    ]

    ,
    styles: [` 


  `]
})
export class WorkflowHistoryComponent implements AfterViewInit {
    statusList: WorkflowStat[] = [];
    events: any[] = [];

    counts: any = [];
    // protected onAdjustCellSizeWhileDraggingChange(event: boolean): void {
    //     this.adjustCellSizeWhileDragging.set(event);

    // }

    constructor(private httpsService: HttpService, private message: NzMessageService) {
    }

    ngOnInit() {
        this.events = [
            {
                "eventId": "1",
                "eventTime": "2025-10-12T12:43:50.699658Z",
                "eventType": "EVENT_TYPE_WORKFLOW_EXECUTION_STARTED",
                "taskId": "1050235",
                "workflowExecutionStartedEventAttributes": {
                    "workflowType": {
                        "name": "IWorkFlowv2"
                    },
                    "taskQueue": {
                        "name": "MICROSERVICE_TASK_QUEUE_V2",
                        "kind": "TASK_QUEUE_KIND_NORMAL"
                    },
                    "input": {
                        "payloads": [
                            {
                                "metadata": {
                                    "encoding": "anNvbi9wbGFpbg=="
                                },
                                "data": "eyJ3b3JrZmxvdyI6W3siaWQiOiIzNzcxNDFlMi0wOGNjLTQ5OTAtOTkwMy1hMzIyOGZkZDVmMjkiLCJ0eXBlIjoic3RhcnQiLCJuYW1lIjoiMSIsImNhbGwiOm51bGwsImNvbmRpdGlvbkNhbGwiOm51bGwsImNvbmRpdGlvbklubGluZSI6IiIsImNvbmZpZyI6eyJ3YWl0U2Vjb25kcyI6MSwidGltZW91dFNlY29uZHMiOjEyMCwibWF4aW11bUF0dGVtcHRzIjoxMCwiaW5pdGlhbEludGVydmFsU2Vjb25kcyI6NCwibWF4aW11bUludGVydmFsU2Vjb25kcyI6MTAsImJhY2tvZmZDb2VmZmljaWVudCI6Mi4wfSwibmV4dCI6IjU1NjgyOTUzLWMwNTItNDUyZC1hNDU0LTA2MjIxYmNmNzE2OCIsIm5leHRGYWxzZSI6bnVsbH0seyJpZCI6IjU1NjgyOTUzLWMwNTItNDUyZC1hNDU0LTA2MjIxYmNmNzE2OCIsInR5cGUiOiJmdW5jdGlvbiIsIm5hbWUiOiJBY3Rpdml0eSIsImNhbGwiOiJ0ZXN0IiwiY29uZGl0aW9uQ2FsbCI6bnVsbCwiY29uZGl0aW9uSW5saW5lIjoiIiwiY29uZmlnIjp7IndhaXRTZWNvbmRzIjoxLCJ0aW1lb3V0U2Vjb25kcyI6MTIwLCJtYXhpbXVtQXR0ZW1wdHMiOjEwLCJpbml0aWFsSW50ZXJ2YWxTZWNvbmRzIjo0LCJtYXhpbXVtSW50ZXJ2YWxTZWNvbmRzIjoxMCwiYmFja29mZkNvZWZmaWNpZW50IjoyLjB9LCJuZXh0IjoiZWE4MDNhNTEtZWExNy00MmUyLWJiMWUtNjJhMDg2OWQzMTgxIiwibmV4dEZhbHNlIjpudWxsfSx7ImlkIjoiZWE4MDNhNTEtZWExNy00MmUyLWJiMWUtNjJhMDg2OWQzMTgxIiwidHlwZSI6ImZ1bmN0aW9uIiwibmFtZSI6IkFjdGl2aXR5IiwiY2FsbCI6InRlc3QyIiwiY29uZGl0aW9uQ2FsbCI6bnVsbCwiY29uZGl0aW9uSW5saW5lIjoiIiwiY29uZmlnIjp7IndhaXRTZWNvbmRzIjoxLCJ0aW1lb3V0U2Vjb25kcyI6MTIwLCJtYXhpbXVtQXR0ZW1wdHMiOjEwLCJpbml0aWFsSW50ZXJ2YWxTZWNvbmRzIjo0LCJtYXhpbXVtSW50ZXJ2YWxTZWNvbmRzIjoxMCwiYmFja29mZkNvZWZmaWNpZW50IjoyLjB9LCJuZXh0IjoiYjE2Yzg0MjUtZmQ4ZC00MWY1LWEwNzEtM2JiYjQyZTQ0ZjRjIiwibmV4dEZhbHNlIjpudWxsfSx7ImlkIjoiYjE2Yzg0MjUtZmQ4ZC00MWY1LWEwNzEtM2JiYjQyZTQ0ZjRjIiwidHlwZSI6ImZ1bmN0aW9uIiwibmFtZSI6IkFjdGl2aXR5IiwiY2FsbCI6InRlc3QxMzEiLCJjb25kaXRpb25DYWxsIjpudWxsLCJjb25kaXRpb25JbmxpbmUiOiIiLCJjb25maWciOnsid2FpdFNlY29uZHMiOjEsInRpbWVvdXRTZWNvbmRzIjoxMjAsIm1heGltdW1BdHRlbXB0cyI6MTAsImluaXRpYWxJbnRlcnZhbFNlY29uZHMiOjQsIm1heGltdW1JbnRlcnZhbFNlY29uZHMiOjEwLCJiYWNrb2ZmQ29lZmZpY2llbnQiOjIuMH0sIm5leHQiOm51bGwsIm5leHRGYWxzZSI6bnVsbH1dLCJpbnB1dCI6eyJpZCI6MzB9fQ=="
                            }
                        ]
                    },
                    "workflowExecutionTimeout": "0s",
                    "workflowRunTimeout": "0s",
                    "workflowTaskTimeout": "10s",
                    "originalExecutionRunId": "0199d872-de2b-7a06-84cb-8a05f331d35d",
                    "identity": "18706@pratiks-MacBook-Pro.local",
                    "firstExecutionRunId": "0199d872-de2b-7a06-84cb-8a05f331d35d",
                    "attempt": 1,
                    "firstWorkflowTaskBackoff": "0s",
                    "header": {},
                    "workflowId": "30"
                }
            },
            {
                "eventId": "2",
                "eventTime": "2025-10-12T12:43:50.699749Z",
                "eventType": "EVENT_TYPE_WORKFLOW_TASK_SCHEDULED",
                "taskId": "1050236",
                "workflowTaskScheduledEventAttributes": {
                    "taskQueue": {
                        "name": "MICROSERVICE_TASK_QUEUE_V2",
                        "kind": "TASK_QUEUE_KIND_NORMAL"
                    },
                    "startToCloseTimeout": "10s",
                    "attempt": 1
                }
            },
            {
                "eventId": "3",
                "eventTime": "2025-10-12T12:43:50.702217Z",
                "eventType": "EVENT_TYPE_WORKFLOW_TASK_STARTED",
                "taskId": "1050241",
                "workflowTaskStartedEventAttributes": {
                    "scheduledEventId": "2",
                    "identity": "18706@pratiks-MacBook-Pro.local",
                    "requestId": "a6f447c4-ba19-4adc-89d9-3ac2f7da3579",
                    "historySizeBytes": "1694"
                }
            },
            {
                "eventId": "4",
                "eventTime": "2025-10-12T12:43:50.711542Z",
                "eventType": "EVENT_TYPE_WORKFLOW_TASK_COMPLETED",
                "taskId": "1050245",
                "workflowTaskCompletedEventAttributes": {
                    "scheduledEventId": "2",
                    "startedEventId": "3",
                    "identity": "18706@pratiks-MacBook-Pro.local",
                    "workerVersion": {},
                    "sdkMetadata": {
                        "langUsedFlags": [
                            1
                        ],
                        "sdkName": "temporal-java",
                        "sdkVersion": "1.31.0"
                    },
                    "meteringMetadata": {}
                }
            },
            {
                "eventId": "5",
                "eventTime": "2025-10-12T12:43:50.711612Z",
                "eventType": "EVENT_TYPE_ACTIVITY_TASK_SCHEDULED",
                "taskId": "1050246",
                "activityTaskScheduledEventAttributes": {
                    "activityId": "40880317-c6fe-31d8-ade6-9d42ef9bb6b8",
                    "activityType": {
                        "name": "CallFunction"
                    },
                    "taskQueue": {
                        "name": "MICROSERVICE_TASK_QUEUE_V2",
                        "kind": "TASK_QUEUE_KIND_NORMAL"
                    },
                    "header": {},
                    "input": {
                        "payloads": [
                            {
                                "metadata": {
                                    "encoding": "anNvbi9wbGFpbg=="
                                },
                                "data": "eyJ3b3JrRmxvd0lkIjoiMzAiLCJ0aW1lU3RhbXAiOiIyMDI1LTEwLTEyVDEyOjQzOjUwLjcwOCswMDowMCIsImFjdGl2aXR5SWQiOiI1NTY4Mjk1My1jMDUyLTQ1MmQtYTQ1NC0wNjIyMWJjZjcxNjgiLCJjb25kaXRpb24iOm51bGwsIndvcmtmbG93QWN0aXZpdHlJZCI6bnVsbCwiaW5wdXQiOnsiaWQiOjMwfSwibWV0YURhdGEiOm51bGwsImNhbGwiOiJ0ZXN0Iiwic3RhdGUiOnsic3RhdGVWYWx1ZSI6e319fQ=="
                            }
                        ]
                    },
                    "scheduleToCloseTimeout": "0s",
                    "scheduleToStartTimeout": "0s",
                    "startToCloseTimeout": "120s",
                    "heartbeatTimeout": "0s",
                    "workflowTaskCompletedEventId": "4",
                    "retryPolicy": {
                        "initialInterval": "4s",
                        "backoffCoefficient": 2.0,
                        "maximumInterval": "10s",
                        "maximumAttempts": 10
                    }
                },
                "userMetadata": {
                    "summary": {
                        "metadata": {
                            "encoding": "anNvbi9wbGFpbg=="
                        },
                        "data": "ImZ1bmN0aW9uOjp0ZXN0Ig=="
                    }
                }
            },
            {
                "eventId": "6",
                "eventTime": "2025-10-12T12:43:50.714391Z",
                "eventType": "EVENT_TYPE_ACTIVITY_TASK_STARTED",
                "taskId": "1050252",
                "activityTaskStartedEventAttributes": {
                    "scheduledEventId": "5",
                    "identity": "18706@pratiks-MacBook-Pro.local",
                    "requestId": "7a86966e-3dc0-4d2a-8145-9fb49524db6e",
                    "attempt": 1,
                    "workerVersion": {}
                }
            },
            {
                "eventId": "7",
                "eventTime": "2025-10-12T12:43:50.724480Z",
                "eventType": "EVENT_TYPE_ACTIVITY_TASK_COMPLETED",
                "taskId": "1050253",
                "activityTaskCompletedEventAttributes": {
                    "result": {
                        "payloads": [
                            {
                                "metadata": {
                                    "encoding": "anNvbi9wbGFpbg=="
                                },
                                "data": "eyJzdGF0dXMiOiJTVUNDRVNTIiwiZXJyb3JDb2RlIjpudWxsLCJtZXNzYWdlIjoiU3VjY2Vzc2Z1bGx5IGNvbXBsZXRlIiwibWV0YURhdGEiOm51bGwsInN0YXRlIjp7InN0YXRlVmFsdWUiOnt9fX0="
                            }
                        ]
                    },
                    "scheduledEventId": "5",
                    "startedEventId": "6",
                    "identity": "18706@pratiks-MacBook-Pro.local"
                }
            },
            {
                "eventId": "8",
                "eventTime": "2025-10-12T12:43:50.724487Z",
                "eventType": "EVENT_TYPE_WORKFLOW_TASK_SCHEDULED",
                "taskId": "1050254",
                "workflowTaskScheduledEventAttributes": {
                    "taskQueue": {
                        "name": "18706@pratiks-MacBook-Pro.local:ae9ffb51-04f3-42c8-9ce9-23bb3c90ec04",
                        "kind": "TASK_QUEUE_KIND_STICKY",
                        "normalName": "MICROSERVICE_TASK_QUEUE_V2"
                    },
                    "startToCloseTimeout": "10s",
                    "attempt": 1
                }
            },
            {
                "eventId": "9",
                "eventTime": "2025-10-12T12:43:50.726183Z",
                "eventType": "EVENT_TYPE_WORKFLOW_TASK_STARTED",
                "taskId": "1050258",
                "workflowTaskStartedEventAttributes": {
                    "scheduledEventId": "8",
                    "identity": "18706@pratiks-MacBook-Pro.local",
                    "requestId": "2f12894b-5a95-4ca9-83a9-f6559e8b41d8",
                    "historySizeBytes": "2802"
                }
            },
            {
                "eventId": "10",
                "eventTime": "2025-10-12T12:43:50.732865Z",
                "eventType": "EVENT_TYPE_WORKFLOW_TASK_COMPLETED",
                "taskId": "1050262",
                "workflowTaskCompletedEventAttributes": {
                    "scheduledEventId": "8",
                    "startedEventId": "9",
                    "identity": "18706@pratiks-MacBook-Pro.local",
                    "workerVersion": {},
                    "sdkMetadata": {
                        "sdkName": "temporal-java",
                        "sdkVersion": "1.31.0"
                    },
                    "meteringMetadata": {}
                }
            },
            {
                "eventId": "11",
                "eventTime": "2025-10-12T12:43:50.733270Z",
                "eventType": "EVENT_TYPE_ACTIVITY_TASK_SCHEDULED",
                "taskId": "1050263",
                "activityTaskScheduledEventAttributes": {
                    "activityId": "b738bc90-2bab-3b9a-b092-c157c69d782d",
                    "activityType": {
                        "name": "CallFunction"
                    },
                    "taskQueue": {
                        "name": "MICROSERVICE_TASK_QUEUE_V2",
                        "kind": "TASK_QUEUE_KIND_NORMAL"
                    },
                    "header": {},
                    "input": {
                        "payloads": [
                            {
                                "metadata": {
                                    "encoding": "anNvbi9wbGFpbg=="
                                },
                                "data": "eyJ3b3JrRmxvd0lkIjoiMzAiLCJ0aW1lU3RhbXAiOiIyMDI1LTEwLTEyVDEyOjQzOjUwLjczMCswMDowMCIsImFjdGl2aXR5SWQiOiJlYTgwM2E1MS1lYTE3LTQyZTItYmIxZS02MmEwODY5ZDMxODEiLCJjb25kaXRpb24iOm51bGwsIndvcmtmbG93QWN0aXZpdHlJZCI6bnVsbCwiaW5wdXQiOnsiaWQiOjMwfSwibWV0YURhdGEiOm51bGwsImNhbGwiOiJ0ZXN0MiIsInN0YXRlIjp7InN0YXRlVmFsdWUiOnt9fX0="
                            }
                        ]
                    },
                    "scheduleToCloseTimeout": "0s",
                    "scheduleToStartTimeout": "0s",
                    "startToCloseTimeout": "120s",
                    "heartbeatTimeout": "0s",
                    "workflowTaskCompletedEventId": "10",
                    "retryPolicy": {
                        "initialInterval": "4s",
                        "backoffCoefficient": 2.0,
                        "maximumInterval": "10s",
                        "maximumAttempts": 10
                    }
                },
                "userMetadata": {
                    "summary": {
                        "metadata": {
                            "encoding": "anNvbi9wbGFpbg=="
                        },
                        "data": "ImZ1bmN0aW9uOjp0ZXN0MiI="
                    }
                }
            },
            {
                "eventId": "12",
                "eventTime": "2025-10-12T12:43:50.734873Z",
                "eventType": "EVENT_TYPE_ACTIVITY_TASK_STARTED",
                "taskId": "1050269",
                "activityTaskStartedEventAttributes": {
                    "scheduledEventId": "11",
                    "identity": "18706@pratiks-MacBook-Pro.local",
                    "requestId": "8532f808-9d3d-4a4a-b813-8d79ce956276",
                    "attempt": 1,
                    "workerVersion": {}
                }
            },
            {
                "eventId": "13",
                "eventTime": "2025-10-12T12:43:50.738984Z",
                "eventType": "EVENT_TYPE_ACTIVITY_TASK_COMPLETED",
                "taskId": "1050270",
                "activityTaskCompletedEventAttributes": {
                    "result": {
                        "payloads": [
                            {
                                "metadata": {
                                    "encoding": "anNvbi9wbGFpbg=="
                                },
                                "data": "eyJzdGF0dXMiOiJTVUNDRVNTIiwiZXJyb3JDb2RlIjpudWxsLCJtZXNzYWdlIjoiU3VjY2Vzc2Z1bGx5IGNvbXBsZXRlIiwibWV0YURhdGEiOm51bGwsInN0YXRlIjp7InN0YXRlVmFsdWUiOnt9fX0="
                            }
                        ]
                    },
                    "scheduledEventId": "11",
                    "startedEventId": "12",
                    "identity": "18706@pratiks-MacBook-Pro.local"
                }
            },
            {
                "eventId": "14",
                "eventTime": "2025-10-12T12:43:50.738991Z",
                "eventType": "EVENT_TYPE_WORKFLOW_TASK_SCHEDULED",
                "taskId": "1050271",
                "workflowTaskScheduledEventAttributes": {
                    "taskQueue": {
                        "name": "18706@pratiks-MacBook-Pro.local:ae9ffb51-04f3-42c8-9ce9-23bb3c90ec04",
                        "kind": "TASK_QUEUE_KIND_STICKY",
                        "normalName": "MICROSERVICE_TASK_QUEUE_V2"
                    },
                    "startToCloseTimeout": "10s",
                    "attempt": 1
                }
            },
            {
                "eventId": "15",
                "eventTime": "2025-10-12T12:43:50.740287Z",
                "eventType": "EVENT_TYPE_WORKFLOW_TASK_STARTED",
                "taskId": "1050275",
                "workflowTaskStartedEventAttributes": {
                    "scheduledEventId": "14",
                    "identity": "18706@pratiks-MacBook-Pro.local",
                    "requestId": "0a40f120-e19c-489e-b061-8bb1964f07e5",
                    "historySizeBytes": "3909"
                }
            },
            {
                "eventId": "16",
                "eventTime": "2025-10-12T12:43:50.744265Z",
                "eventType": "EVENT_TYPE_WORKFLOW_TASK_COMPLETED",
                "taskId": "1050279",
                "workflowTaskCompletedEventAttributes": {
                    "scheduledEventId": "14",
                    "startedEventId": "15",
                    "identity": "18706@pratiks-MacBook-Pro.local",
                    "workerVersion": {},
                    "sdkMetadata": {
                        "sdkName": "temporal-java",
                        "sdkVersion": "1.31.0"
                    },
                    "meteringMetadata": {}
                }
            },
            {
                "eventId": "17",
                "eventTime": "2025-10-12T12:43:50.744318Z",
                "eventType": "EVENT_TYPE_ACTIVITY_TASK_SCHEDULED",
                "taskId": "1050280",
                "activityTaskScheduledEventAttributes": {
                    "activityId": "64f9a875-2ac3-32a5-af0f-a058bccc85a3",
                    "activityType": {
                        "name": "CallFunction"
                    },
                    "taskQueue": {
                        "name": "MICROSERVICE_TASK_QUEUE_V2",
                        "kind": "TASK_QUEUE_KIND_NORMAL"
                    },
                    "header": {},
                    "input": {
                        "payloads": [
                            {
                                "metadata": {
                                    "encoding": "anNvbi9wbGFpbg=="
                                },
                                "data": "eyJ3b3JrRmxvd0lkIjoiMzAiLCJ0aW1lU3RhbXAiOiIyMDI1LTEwLTEyVDEyOjQzOjUwLjc0MiswMDowMCIsImFjdGl2aXR5SWQiOiJiMTZjODQyNS1mZDhkLTQxZjUtYTA3MS0zYmJiNDJlNDRmNGMiLCJjb25kaXRpb24iOm51bGwsIndvcmtmbG93QWN0aXZpdHlJZCI6bnVsbCwiaW5wdXQiOnsiaWQiOjMwfSwibWV0YURhdGEiOm51bGwsImNhbGwiOiJ0ZXN0MTMxIiwic3RhdGUiOnsic3RhdGVWYWx1ZSI6e319fQ=="
                            }
                        ]
                    },
                    "scheduleToCloseTimeout": "0s",
                    "scheduleToStartTimeout": "0s",
                    "startToCloseTimeout": "120s",
                    "heartbeatTimeout": "0s",
                    "workflowTaskCompletedEventId": "16",
                    "retryPolicy": {
                        "initialInterval": "4s",
                        "backoffCoefficient": 2.0,
                        "maximumInterval": "10s",
                        "maximumAttempts": 10
                    }
                },
                "userMetadata": {
                    "summary": {
                        "metadata": {
                            "encoding": "anNvbi9wbGFpbg=="
                        },
                        "data": "ImZ1bmN0aW9uOjp0ZXN0MTMxIg=="
                    }
                }
            },
            {
                "eventId": "18",
                "eventTime": "2025-10-12T12:45:12.866634Z",
                "eventType": "EVENT_TYPE_ACTIVITY_TASK_STARTED",
                "taskId": "1050312",
                "activityTaskStartedEventAttributes": {
                    "scheduledEventId": "17",
                    "identity": "18706@pratiks-MacBook-Pro.local",
                    "requestId": "53fa4155-7c33-4aad-90c0-c63087b7d287",
                    "attempt": 10,
                    "lastFailure": {
                        "message": "Failure exceeds size limit.",
                        "cause": {
                            "message": "PreparedStatementCallback; Duplicate entry \u00271\u0027 for key \u0027test1.PRIMARY\u0027",
                            "source": "JavaSDK",
                            "stackTrace": "org.springframework.jdbc.support.SQLExceptionSubclassTranslator.doTranslate(SQLExceptionSubclassTranslator.java:95)\norg.springframework.jdbc.support.AbstractFallbackSQLExceptionTranslator.translate(AbstractFallbackSQLExceptionTranslator.java:107)\norg.springframework.jdbc.core.JdbcTemplate.translateException(JdbcTemplate.java:1556)\norg.springframework.jdbc.core.JdbcTemplate.execute(JdbcTemplate.java:677)\norg.springframework.jdbc.core.JdbcTemplate.update(JdbcTemplate.java:1003)\nio.falconFlow.dao.DB.insert(DB.java:30)\nio.falconFlow.functions.test131.invoke(test131.java:30)\nio.falconFlow.DSL.activity.FunctionActivityImpl.callFunction(FunctionActivityImpl.java:40)\njdk.internal.reflect.GeneratedMethodAccessor56.invoke(Unknown Source)\njava.base/jdk.internal.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)\njava.base/java.lang.reflect.Method.invoke(Method.java:569)\nio.temporal.internal.activity.RootActivityInboundCallsInterceptor$POJOActivityInboundCallsInterceptor.executeActivity(RootActivityInboundCallsInterceptor.java:44)\nio.temporal.internal.activity.RootActivityInboundCallsInterceptor.execute(RootActivityInboundCallsInterceptor.java:23)\nio.temporal.internal.activity.ActivityTaskExecutors$BaseActivityTaskExecutor.execute(ActivityTaskExecutors.java:88)\nio.temporal.internal.activity.ActivityTaskHandlerImpl.handle(ActivityTaskHandlerImpl.java:105)\nio.temporal.internal.worker.ActivityWorker$TaskHandlerImpl.handleActivity(ActivityWorker.java:294)\nio.temporal.internal.worker.ActivityWorker$TaskHandlerImpl.handle(ActivityWorker.java:258)\nio.temporal.internal.worker.ActivityWorker$TaskHandlerImpl.handle(ActivityWorker.java:221)\nio.temporal.internal.worker.PollTaskExecutor.lambda$process$1(PollTaskExecutor.java:76)\njava.base/java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1136)\njava.base/java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:635)\njava.base/java.lang.Thread.run(Thread.java:840)\n",
                            "cause": {
                                "message": "Duplicate entry \u00271\u0027 for key \u0027test1.PRIMARY\u0027",
                                "source": "JavaSDK",
                                "stackTrace": "com.mysql.cj.jdbc.exceptions.SQLError.createSQLException(SQLError.java:118)\ncom.mysql.cj.jdbc.exceptions.SQLExceptionsMapping.translateException(SQLExceptionsMapping.java:122)\ncom.mysql.cj.jdbc.ClientPreparedStatement.executeInternal(ClientPreparedStatement.java:916)\ncom.mysql.cj.jdbc.ClientPreparedStatement.executeUpdateInternal(ClientPreparedStatement.java:1061)\ncom.mysql.cj.jdbc.ClientPreparedStatement.executeUpdateInternal(ClientPreparedStatement.java:1009)\ncom.mysql.cj.jdbc.ClientPreparedStatement.executeLargeUpdate(ClientPreparedStatement.java:1320)\ncom.mysql.cj.jdbc.ClientPreparedStatement.executeUpdate(ClientPreparedStatement.java:994)\ncom.zaxxer.hikari.pool.ProxyPreparedStatement.executeUpdate(ProxyPreparedStatement.java:61)\ncom.zaxxer.hikari.pool.HikariProxyPreparedStatement.executeUpdate(HikariProxyPreparedStatement.java)\norg.springframework.jdbc.core.JdbcTemplate.lambda$update$3(JdbcTemplate.java:1004)\norg.springframework.jdbc.core.JdbcTemplate.execute(JdbcTemplate.java:658)\norg.springframework.jdbc.core.JdbcTemplate.update(JdbcTemplate.java:1003)\nio.falconFlow.dao.DB.insert(DB.java:30)\nio.falconFlow.functions.test131.invoke(test131.java:30)\nio.falconFlow.DSL.activity.FunctionActivityImpl.callFunction(FunctionActivityImpl.java:40)\njdk.internal.reflect.GeneratedMethodAccessor56.invoke(Unknown Source)\njava.base/jdk.internal.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)\njava.base/java.lang.reflect.Method.invoke(Method.java:569)\nio.temporal.internal.activity.RootActivityInboundCallsInterceptor$POJOActivityInboundCallsInterceptor.executeActivity(RootActivityInboundCallsInterceptor.java:44)\nio.temporal.internal.activity.RootActivityInboundCallsInterceptor.execute(RootActivityInboundCallsInterceptor.java:23)\nio.temporal.internal.activity.ActivityTaskExecutors$Base",
                                "applicationFailureInfo": {
                                    "type": "java.sql.SQLIntegrityConstraintViolationException"
                                }
                            },
                            "applicationFailureInfo": {
                                "type": "org.springframework.dao.DuplicateKeyException"
                            }
                        },
                        "serverFailureInfo": {}
                    },
                    "workerVersion": {}
                }
            },
            {
                "eventId": "19",
                "eventTime": "2025-10-12T12:45:12.876560Z",
                "eventType": "EVENT_TYPE_ACTIVITY_TASK_FAILED",
                "taskId": "1050313",
                "activityTaskFailedEventAttributes": {
                    "failure": {
                        "message": "PreparedStatementCallback; Duplicate entry \u00271\u0027 for key \u0027test1.PRIMARY\u0027",
                        "source": "JavaSDK",
                        "stackTrace": "org.springframework.jdbc.support.SQLExceptionSubclassTranslator.doTranslate(SQLExceptionSubclassTranslator.java:95)\norg.springframework.jdbc.support.AbstractFallbackSQLExceptionTranslator.translate(AbstractFallbackSQLExceptionTranslator.java:107)\norg.springframework.jdbc.core.JdbcTemplate.translateException(JdbcTemplate.java:1556)\norg.springframework.jdbc.core.JdbcTemplate.execute(JdbcTemplate.java:677)\norg.springframework.jdbc.core.JdbcTemplate.update(JdbcTemplate.java:1003)\nio.falconFlow.dao.DB.insert(DB.java:30)\nio.falconFlow.functions.test131.invoke(test131.java:30)\nio.falconFlow.DSL.activity.FunctionActivityImpl.callFunction(FunctionActivityImpl.java:40)\njdk.internal.reflect.GeneratedMethodAccessor56.invoke(Unknown Source)\njava.base/jdk.internal.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)\njava.base/java.lang.reflect.Method.invoke(Method.java:569)\nio.temporal.internal.activity.RootActivityInboundCallsInterceptor$POJOActivityInboundCallsInterceptor.executeActivity(RootActivityInboundCallsInterceptor.java:44)\nio.temporal.internal.activity.RootActivityInboundCallsInterceptor.execute(RootActivityInboundCallsInterceptor.java:23)\nio.temporal.internal.activity.ActivityTaskExecutors$BaseActivityTaskExecutor.execute(ActivityTaskExecutors.java:88)\nio.temporal.internal.activity.ActivityTaskHandlerImpl.handle(ActivityTaskHandlerImpl.java:105)\nio.temporal.internal.worker.ActivityWorker$TaskHandlerImpl.handleActivity(ActivityWorker.java:294)\nio.temporal.internal.worker.ActivityWorker$TaskHandlerImpl.handle(ActivityWorker.java:258)\nio.temporal.internal.worker.ActivityWorker$TaskHandlerImpl.handle(ActivityWorker.java:221)\nio.temporal.internal.worker.PollTaskExecutor.lambda$process$1(PollTaskExecutor.java:76)\njava.base/java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1136)\njava.base/java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:635)\njava.base/java.lang.Thread.run(Thread.java:840)\n",
                        "cause": {
                            "message": "Duplicate entry \u00271\u0027 for key \u0027test1.PRIMARY\u0027",
                            "source": "JavaSDK",
                            "stackTrace": "com.mysql.cj.jdbc.exceptions.SQLError.createSQLException(SQLError.java:118)\ncom.mysql.cj.jdbc.exceptions.SQLExceptionsMapping.translateException(SQLExceptionsMapping.java:122)\ncom.mysql.cj.jdbc.ClientPreparedStatement.executeInternal(ClientPreparedStatement.java:916)\ncom.mysql.cj.jdbc.ClientPreparedStatement.executeUpdateInternal(ClientPreparedStatement.java:1061)\ncom.mysql.cj.jdbc.ClientPreparedStatement.executeUpdateInternal(ClientPreparedStatement.java:1009)\ncom.mysql.cj.jdbc.ClientPreparedStatement.executeLargeUpdate(ClientPreparedStatement.java:1320)\ncom.mysql.cj.jdbc.ClientPreparedStatement.executeUpdate(ClientPreparedStatement.java:994)\ncom.zaxxer.hikari.pool.ProxyPreparedStatement.executeUpdate(ProxyPreparedStatement.java:61)\ncom.zaxxer.hikari.pool.HikariProxyPreparedStatement.executeUpdate(HikariProxyPreparedStatement.java)\norg.springframework.jdbc.core.JdbcTemplate.lambda$update$3(JdbcTemplate.java:1004)\norg.springframework.jdbc.core.JdbcTemplate.execute(JdbcTemplate.java:658)\norg.springframework.jdbc.core.JdbcTemplate.update(JdbcTemplate.java:1003)\nio.falconFlow.dao.DB.insert(DB.java:30)\nio.falconFlow.functions.test131.invoke(test131.java:30)\nio.falconFlow.DSL.activity.FunctionActivityImpl.callFunction(FunctionActivityImpl.java:40)\njdk.internal.reflect.GeneratedMethodAccessor56.invoke(Unknown Source)\njava.base/jdk.internal.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)\njava.base/java.lang.reflect.Method.invoke(Method.java:569)\nio.temporal.internal.activity.RootActivityInboundCallsInterceptor$POJOActivityInboundCallsInterceptor.executeActivity(RootActivityInboundCallsInterceptor.java:44)\nio.temporal.internal.activity.RootActivityInboundCallsInterceptor.execute(RootActivityInboundCallsInterceptor.java:23)\nio.temporal.internal.activity.ActivityTaskExecutors$BaseActivityTaskExecutor.execute(ActivityTaskExecutors.java:88)\nio.temporal.internal.activity.ActivityTaskHandlerImpl.handle(ActivityTaskHandlerImpl.java:105)\nio.temporal.internal.worker.ActivityWorker$TaskHandlerImpl.handleActivity(ActivityWorker.java:294)\nio.temporal.internal.worker.ActivityWorker$TaskHandlerImpl.handle(ActivityWorker.java:258)\nio.temporal.internal.worker.ActivityWorker$TaskHandlerImpl.handle(ActivityWorker.java:221)\nio.temporal.internal.worker.PollTaskExecutor.lambda$process$1(PollTaskExecutor.java:76)\njava.base/java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1136)\njava.base/java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:635)\njava.base/java.lang.Thread.run(Thread.java:840)\n",
                            "applicationFailureInfo": {
                                "type": "java.sql.SQLIntegrityConstraintViolationException"
                            }
                        },
                        "applicationFailureInfo": {
                            "type": "org.springframework.dao.DuplicateKeyException"
                        }
                    },
                    "scheduledEventId": "17",
                    "startedEventId": "18",
                    "identity": "18706@pratiks-MacBook-Pro.local",
                    "retryState": "RETRY_STATE_MAXIMUM_ATTEMPTS_REACHED"
                }
            },
            {
                "eventId": "20",
                "eventTime": "2025-10-12T12:45:12.876568Z",
                "eventType": "EVENT_TYPE_WORKFLOW_TASK_SCHEDULED",
                "taskId": "1050314",
                "workflowTaskScheduledEventAttributes": {
                    "taskQueue": {
                        "name": "18706@pratiks-MacBook-Pro.local:ae9ffb51-04f3-42c8-9ce9-23bb3c90ec04",
                        "kind": "TASK_QUEUE_KIND_STICKY",
                        "normalName": "MICROSERVICE_TASK_QUEUE_V2"
                    },
                    "startToCloseTimeout": "10s",
                    "attempt": 1
                }
            },
            {
                "eventId": "21",
                "eventTime": "2025-10-12T12:45:12.879249Z",
                "eventType": "EVENT_TYPE_WORKFLOW_TASK_STARTED",
                "taskId": "1050318",
                "workflowTaskStartedEventAttributes": {
                    "scheduledEventId": "20",
                    "identity": "18706@pratiks-MacBook-Pro.local",
                    "requestId": "330449fb-0266-4e63-99b7-0c0d3cf96e0c",
                    "historySizeBytes": "13817"
                }
            },
            {
                "eventId": "22",
                "eventTime": "2025-10-12T12:45:12.889912Z",
                "eventType": "EVENT_TYPE_WORKFLOW_TASK_COMPLETED",
                "taskId": "1050322",
                "workflowTaskCompletedEventAttributes": {
                    "scheduledEventId": "20",
                    "startedEventId": "21",
                    "identity": "18706@pratiks-MacBook-Pro.local",
                    "workerVersion": {},
                    "sdkMetadata": {
                        "sdkName": "temporal-java",
                        "sdkVersion": "1.31.0"
                    },
                    "meteringMetadata": {}
                }
            },
            {
                "eventId": "23",
                "eventTime": "2025-10-12T12:45:12.889957Z",
                "eventType": "EVENT_TYPE_WORKFLOW_EXECUTION_FAILED",
                "taskId": "1050323",
                "workflowExecutionFailedEventAttributes": {
                    "failure": {
                        "message": "Activity task failed",
                        "cause": {
                            "message": "PreparedStatementCallback; Duplicate entry \u00271\u0027 for key \u0027test1.PRIMARY\u0027",
                            "source": "JavaSDK",
                            "stackTrace": "org.springframework.jdbc.support.SQLExceptionSubclassTranslator.doTranslate(SQLExceptionSubclassTranslator.java:95)\norg.springframework.jdbc.support.AbstractFallbackSQLExceptionTranslator.translate(AbstractFallbackSQLExceptionTranslator.java:107)\norg.springframework.jdbc.core.JdbcTemplate.translateException(JdbcTemplate.java:1556)\norg.springframework.jdbc.core.JdbcTemplate.execute(JdbcTemplate.java:677)\norg.springframework.jdbc.core.JdbcTemplate.update(JdbcTemplate.java:1003)\nio.falconFlow.dao.DB.insert(DB.java:30)\nio.falconFlow.functions.test131.invoke(test131.java:30)\nio.falconFlow.DSL.activity.FunctionActivityImpl.callFunction(FunctionActivityImpl.java:40)\njdk.internal.reflect.GeneratedMethodAccessor56.invoke(Unknown Source)\njava.base/jdk.internal.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)\njava.base/java.lang.reflect.Method.invoke(Method.java:569)\nio.temporal.internal.activity.RootActivityInboundCallsInterceptor$POJOActivityInboundCallsInterceptor.executeActivity(RootActivityInboundCallsInterceptor.java:44)\nio.temporal.internal.activity.RootActivityInboundCallsInterceptor.execute(RootActivityInboundCallsInterceptor.java:23)\nio.temporal.internal.activity.ActivityTaskExecutors$BaseActivityTaskExecutor.execute(ActivityTaskExecutors.java:88)\nio.temporal.internal.activity.ActivityTaskHandlerImpl.handle(ActivityTaskHandlerImpl.java:105)\nio.temporal.internal.worker.ActivityWorker$TaskHandlerImpl.handleActivity(ActivityWorker.java:294)\nio.temporal.internal.worker.ActivityWorker$TaskHandlerImpl.handle(ActivityWorker.java:258)\nio.temporal.internal.worker.ActivityWorker$TaskHandlerImpl.handle(ActivityWorker.java:221)\nio.temporal.internal.worker.PollTaskExecutor.lambda$process$1(PollTaskExecutor.java:76)\njava.base/java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1136)\njava.base/java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:635)\njava.base/java.lang.Thread.run(Thread.java:840)\n",
                            "cause": {
                                "message": "Duplicate entry \u00271\u0027 for key \u0027test1.PRIMARY\u0027",
                                "source": "JavaSDK",
                                "stackTrace": "com.mysql.cj.jdbc.exceptions.SQLError.createSQLException(SQLError.java:118)\ncom.mysql.cj.jdbc.exceptions.SQLExceptionsMapping.translateException(SQLExceptionsMapping.java:122)\ncom.mysql.cj.jdbc.ClientPreparedStatement.executeInternal(ClientPreparedStatement.java:916)\ncom.mysql.cj.jdbc.ClientPreparedStatement.executeUpdateInternal(ClientPreparedStatement.java:1061)\ncom.mysql.cj.jdbc.ClientPreparedStatement.executeUpdateInternal(ClientPreparedStatement.java:1009)\ncom.mysql.cj.jdbc.ClientPreparedStatement.executeLargeUpdate(ClientPreparedStatement.java:1320)\ncom.mysql.cj.jdbc.ClientPreparedStatement.executeUpdate(ClientPreparedStatement.java:994)\ncom.zaxxer.hikari.pool.ProxyPreparedStatement.executeUpdate(ProxyPreparedStatement.java:61)\ncom.zaxxer.hikari.pool.HikariProxyPreparedStatement.executeUpdate(HikariProxyPreparedStatement.java)\norg.springframework.jdbc.core.JdbcTemplate.lambda$update$3(JdbcTemplate.java:1004)\norg.springframework.jdbc.core.JdbcTemplate.execute(JdbcTemplate.java:658)\norg.springframework.jdbc.core.JdbcTemplate.update(JdbcTemplate.java:1003)\nio.falconFlow.dao.DB.insert(DB.java:30)\nio.falconFlow.functions.test131.invoke(test131.java:30)\nio.falconFlow.DSL.activity.FunctionActivityImpl.callFunction(FunctionActivityImpl.java:40)\njdk.internal.reflect.GeneratedMethodAccessor56.invoke(Unknown Source)\njava.base/jdk.internal.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)\njava.base/java.lang.reflect.Method.invoke(Method.java:569)\nio.temporal.internal.activity.RootActivityInboundCallsInterceptor$POJOActivityInboundCallsInterceptor.executeActivity(RootActivityInboundCallsInterceptor.java:44)\nio.temporal.internal.activity.RootActivityInboundCallsInterceptor.execute(RootActivityInboundCallsInterceptor.java:23)\nio.temporal.internal.activity.ActivityTaskExecutors$BaseActivityTaskExecutor.execute(ActivityTaskExecutors.java:88)\nio.temporal.internal.activity.ActivityTaskHandlerImpl.handle(ActivityTaskHandlerImpl.java:105)\nio.temporal.internal.worker.ActivityWorker$TaskHandlerImpl.handleActivity(ActivityWorker.java:294)\nio.temporal.internal.worker.ActivityWorker$TaskHandlerImpl.handle(ActivityWorker.java:258)\nio.temporal.internal.worker.ActivityWorker$TaskHandlerImpl.handle(ActivityWorker.java:221)\nio.temporal.internal.worker.PollTaskExecutor.lambda$process$1(PollTaskExecutor.java:76)\njava.base/java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1136)\njava.base/java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:635)\njava.base/java.lang.Thread.run(Thread.java:840)\n",
                                "applicationFailureInfo": {
                                    "type": "java.sql.SQLIntegrityConstraintViolationException"
                                }
                            },
                            "applicationFailureInfo": {
                                "type": "org.springframework.dao.DuplicateKeyException"
                            }
                        },
                        "activityFailureInfo": {
                            "scheduledEventId": "17",
                            "startedEventId": "18",
                            "identity": "18706@pratiks-MacBook-Pro.local",
                            "activityType": {
                                "name": "CallFunction"
                            },
                            "activityId": "64f9a875-2ac3-32a5-af0f-a058bccc85a3",
                            "retryState": "RETRY_STATE_MAXIMUM_ATTEMPTS_REACHED"
                        }
                    },
                    "retryState": "RETRY_STATE_RETRY_POLICY_NOT_SET",
                    "workflowTaskCompletedEventId": "22"
                }
            }
        ];

        let data: any = {};
        // Mock data (replace with API call)
        // this.httpsService.getDashboardCount().subscribe(((a: any) => {

        //     //this.setupChart(data);
        // }))



    }
    ngAfterViewInit() {

    }

    /** Toggle expanded state for an event */
    expanded = new Map<number | string, boolean>();

    toggleExpand(id: number | string) {
        this.expanded.set(id, !this.expanded.get(id));
    }

    /** Friendly event title shown on the timeline */
    eventTitle(ev: any): string {
        const type = ev?.eventType ?? ev?.type ?? ev?.name ?? 'Unknown';
        const id = ev?.eventId ?? ev?.id ?? '';
        return `${type}${id ? ' #' + id : ''}`;
    }

    /** Friendly time */
    eventTime(ev: any): string {
        // Common possible fields: eventTime, timestamp, timestampMillis, eventTimeMicros
        const t =
            ev?.eventTime ??
            ev?.timestamp ??
            ev?.timestampMillis ??
            ev?.event_time ??
            null;

        if (!t) return '';
        // If it's numeric (seconds or millis)
        if (typeof t === 'number') {
            // heuristic: if > 1e12 treat as ms, else seconds
            const ms = t > 1e12 ? t : t * 1000;
            return new Date(ms).toLocaleString();
        }
        // parse ISO if available
        try {
            const d = new Date(t);
            if (!isNaN(d.getTime())) return d.toLocaleString();
        } catch (e) { }
        return String(t);
    }

    /** Build a short summary from attributes or event payloads */
    summary(ev: any): string {
        // Check known Temporal typed attributes
        // e.g., WorkflowExecutionStartedEventAttributes => ev.workflowExecutionStartedEventAttributes
        const attrs =
            ev?.workflowExecutionStartedEventAttributes ??
            ev?.activityTaskScheduledEventAttributes ??
            ev?.activityTaskStartedEventAttributes ??
            ev?.activityTaskCompletedEventAttributes ??
            ev?.signalExternalWorkflowExecutionInitiatedEventAttributes ??
            ev?.requestCancelExternalWorkflowExecutionInitiatedEventAttributes ??
            ev?.workflowTaskCompletedEventAttributes ??
            ev?.attributes ??
            ev?.payloads ??
            null;

        // Special handling for userMetadata block (example you provided)
        const userMeta = this.getNested(ev, ['userMetadata', 'summary']);
        if (userMeta) {
            const encoding = this.getNested(userMeta, ['metadata', 'encoding']);
            const data = this.getNested(userMeta, ['data']);
            const enc = encoding ? this.tryDecodeIfBase64(encoding) : encoding;
            const dat = data ? this.tryDecodeIfBase64(data) : data;
            return `userMetadata (${enc ?? 'unknown'}): ${dat ?? '-'}`;
        }

        // If attrs contains a 'name', 'reason', 'message', 'activityType' etc., use them
        const keysToTry = ['activityType', 'name', 'reason', 'message', 'details', 'input'];
        for (const k of keysToTry) {
            const v = this.getNested(attrs, [k]);
            if (v) return this.stringifySmall(v);
        }

        // fallback: if payloads exist (array) try to decode first payload
        const payloads = this.getNested(ev, ['attributes', 'payloads']) ?? this.getNested(ev, ['payloads']);
        if (Array.isArray(payloads) && payloads.length) {
            const p = payloads[0];
            // payload may have 'data' base64
            const candidate = p?.data ?? p;
            if (typeof candidate === 'string') {
                return this.tryDecodeIfBase64(candidate) ?? this.truncate(candidate);
            }
        }

        return '(no summary)';
    }

    /** Pretty printed raw JSON */
    pretty(ev: any): string {
        try {
            return JSON.stringify(ev, null, 2);
        } catch (e) {
            return String(ev);
        }
    }

    /** Utility: safe nested getter */
    getNested(obj: any, path: string[]): any {
        let cur = obj;
        for (const p of path) {
            if (cur == null) return null;
            cur = cur[p];
        }
        return cur;
    }

    /** Try base64 decode if string looks like base64, otherwise return original */
    tryDecodeIfBase64(s: string): string {
        if (typeof s !== 'string') return s;
        const trimmed = s.trim();
        if (!trimmed) return s;
        // quick regex: base64 chars + optional padding
        const base64Regex = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
        if (!base64Regex.test(trimmed)) return s;
        try {
            // browser safe atob
            const decoded = atob(trimmed);
            // If decoded is JSON, pretty print
            try {
                const parsed = JSON.parse(decoded);
                return typeof parsed === 'string' ? parsed : JSON.stringify(parsed);
            } catch {
                return decoded;
            }
        } catch {
            return s;
        }
    }

    stringifySmall(v: any): string {
        if (v == null) return '';
        if (typeof v === 'string') return this.truncate(v);
        try {
            return JSON.stringify(v);
        } catch {
            return String(v);
        }
    }

    truncate(s: string, len = 100) {
        return s.length > len ? s.slice(0, len) + '…' : s;
    }

    isExpanded(id: number | string) {
        return !!this.expanded.get(id);
    }

}
