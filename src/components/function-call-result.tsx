import React, { useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

// Define FunctionCall type locally since we don't have access to the ai package type
interface FunctionCall {
  name: string;
  arguments: string;
}

interface FunctionCallResultProps {
  functionCall: FunctionCall;
  result: string;
}

export function FunctionCallResult({
  functionCall,
  result,
}: FunctionCallResultProps) {
  const { name, arguments: args } = functionCall;

  useEffect(() => {
    console.log('🔍 FunctionCallResult rendered with:', {
      functionName: name,
      arguments: args,
      resultLength: result.length,
    });
  }, [name, args, result]);

  // Try to parse the result as JSON for better display
  let parsedResult;
  try {
    parsedResult = JSON.parse(result);
    console.log(
      '✅ Successfully parsed function result as JSON:',
      parsedResult,
    );
  } catch (e) {
    console.warn('⚠️ Failed to parse function result as JSON:', result);
    parsedResult = result;
  }

  const renderWeatherResult = (data: any) => {
    console.log('🌤️ Rendering weather result:', data);
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Location:</span>
          <span className="font-medium">{data.location}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Temperature:</span>
          <span className="font-medium">
            {data.temperature}°{data.unit === 'celsius' ? 'C' : 'F'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Conditions:</span>
          <span className="font-medium">{data.conditions}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Humidity:</span>
          <span className="font-medium">{data.humidity}</span>
        </div>
      </div>
    );
  };

  const renderSearchResult = (data: any) => {
    console.log('🔎 Rendering search result:', data);
    return (
      <div className="flex flex-col gap-2">
        {Array.isArray(data) &&
          data.map((item, index) => (
            <div key={index} className="border rounded p-2">
              <h4 className="font-medium">{item.title}</h4>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-500 hover:underline"
              >
                {item.url}
              </a>
              <p className="text-sm text-muted-foreground mt-1">
                {item.snippet}
              </p>
            </div>
          ))}
      </div>
    );
  };

  const renderResult = () => {
    if (typeof parsedResult === 'string') {
      console.log('📝 Rendering string result');
      return <p>{parsedResult}</p>;
    }

    console.log(`🧩 Rendering result for function: ${name}`);
    switch (name) {
      case 'getWeather':
        return renderWeatherResult(parsedResult);
      case 'searchWeb':
        return renderSearchResult(parsedResult);
      default:
        console.log('📋 Rendering generic JSON result');
        return (
          <pre className="text-xs overflow-auto p-2 bg-secondary rounded">
            {JSON.stringify(parsedResult, null, 2)}
          </pre>
        );
    }
  };

  // Format the function name for the title
  const formattedName = name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase());

  return (
    <Card className="w-full mb-2 bg-secondary/30">
      <CardHeader className="py-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <span className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs">
            Function
          </span>
          {formattedName}
        </CardTitle>
        <CardDescription className="text-xs">
          {name === 'getWeather'
            ? 'Weather information'
            : name === 'searchWeb'
            ? 'Search results'
            : 'Function result'}
        </CardDescription>
      </CardHeader>
      <CardContent className="py-2">{renderResult()}</CardContent>
    </Card>
  );
}
